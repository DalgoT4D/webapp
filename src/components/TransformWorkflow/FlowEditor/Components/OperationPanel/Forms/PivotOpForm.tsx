import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';

interface PivotDataConfig {
  source_columns: string[];
  pivot_column_name: string;
  pivot_column_values: string[];
}

const PivotOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const [colFieldData, setColFieldData] = useState<any[]>([]);
  const [selectAllCheckbox, setSelectAllCheckbox] = useState<boolean>(false);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
        ? (node?.data as OperationNodeData)
        : {};

  type FormProps = {
    pivot_column_name: string;
    pivot_column_values: {
      col: string;
    }[];
    source_columns: { col: string; is_checked: boolean }[];
  };

  const { control, register, handleSubmit, reset, watch, formState, setValue } =
    useForm<FormProps>({
      defaultValues: {
        pivot_column_name: '',
        pivot_column_values: [
          {
            col: '',
          },
        ],
        source_columns: [],
      },
    });

  const pivotColumn: string = watch('pivot_column_name');

  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pivot_column_values',
    rules: {
      minLength: {
        value: 2,
        message: 'Atleast one value is required',
      },
    },
  });

  const {
    fields: srcColFields,
    replace,
    update,
  } = useFieldArray({
    control,
    name: 'source_columns',
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
        const col_fields = data.sort((a, b) => a.name.localeCompare(b.name))
          .map((col: ColumnData) => ({ col: col.name, is_checked: false }))
        setValue('source_columns', col_fields);
        setColFieldData(col_fields)
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setSrcColumns(nodeData.output_cols);
      setValue(
        'source_columns',
        nodeData.output_cols
          .sort((a: string, b: string) => a.localeCompare(b))
          .map((col: string) => ({ col: col, is_checked: false }))
      );
    }
  };

  const handleSave = async (data: FormProps) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: data.source_columns
          .filter(
            (src_col) => src_col.is_checked && src_col.col !== pivotColumn
          )
          .map((src_col) => src_col.col),
        config: {
          pivot_column_name: data.pivot_column_name,
          pivot_column_values: data.pivot_column_values
            .filter((item) => item.col)
            .map((item) => item.col),
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      setLoading(true);
      // api call
      let operationNode: any;
      if (action === 'create') {
        operationNode = await httpPost(
          session,
          `transform/dbt_project/model/`,
          postData
        );
      } else if (action === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid
            ? inputModels[0].uuid
            : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${node?.id}/`,
          postData
        );
      }

      continueOperationChain(operationNode);
      reset();
    } catch (error: any) {
      console.log(error);
      errorToast(error?.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndSetConfigForEdit = async () => {
    try {
      setLoading(true);
      const { config, prev_source_columns }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const {
        source_columns,
        pivot_column_name,
        pivot_column_values,
      }: PivotDataConfig = opConfig;
      let orginalSrcColumns: string[] = [];
      if (prev_source_columns) {
        orginalSrcColumns = prev_source_columns.sort((a, b) =>
          a.localeCompare(b)
        );
      }
      setSrcColumns(orginalSrcColumns);

      const groupbySourceColumns = orginalSrcColumns.map((col) => ({
        col: col,
        is_checked: source_columns.includes(col),
      }));

      // pre-fill form
      reset({
        pivot_column_name: pivot_column_name,
        pivot_column_values: pivot_column_values
          .map((col: string) => ({
            col: col,
          }))
          .concat([{ col: '' }]),
        source_columns: groupbySourceColumns,
      });
      setColFieldData(groupbySourceColumns)

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const trimmedSubstring = value?.toLowerCase();
    const filteredColumns = srcColFields?.filter((colField) => {
      const stringToSearch = colField?.col?.toLowerCase();
      return stringToSearch.includes(trimmedSubstring);
    })
    setColFieldData(filteredColumns)
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Filter the fields based on the search results stored in colFieldData
    const filteredFields = srcColFields.filter((field) =>
      colFieldData.some((colField) => colField.col === field.col)
    );

    // Update the filtered fields based on the select all checkbox
    const updatedFields = filteredFields.map((field) => ({
      col: field.col,
      is_checked: event.target.checked,
    }));

    setColFieldData(updatedFields)

    // Merge the updated fields with the original unpivotColFields
    const mergedFields = srcColFields.map((field) =>
      updatedFields.find((updatedField) => updatedField.col === field.col) || field
    );

    replace(mergedFields);
  };

  const handleUpdate = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const field = colFieldData[index];
    const updatedFields = colFieldData.map((colField) => {
      if (colField.col == field.col) {
        return {
          col: field.col,
          is_checked: event.target.checked,
        }
      }
      return colField;
    }
    );
    const originalIndex = srcColFields?.findIndex((colField) => colField.col == field.col)

    update(originalIndex, {
      col: field.col,
      is_checked: event.target.checked,
    });
    setColFieldData(updatedFields);
  }

  useEffect(() => {
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  useEffect(() => {
    if (colFieldData?.length > 0) {
      let selectAll = true
      colFieldData?.forEach((colField) => {
        if (!colField.is_checked) selectAll = false;
      })
      setSelectAllCheckbox(selectAll)
    }
  }, [colFieldData])

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form
        onSubmit={handleSubmit(handleSave)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Controller
            control={control}
            name={`pivot_column_name`}
            rules={{ required: 'Pivot Column is required' }}
            render={({ field, fieldState }) => (
              <Autocomplete
                {...field}
                data-testid="pivot"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={action === 'view'}
                options={srcColumns.sort((a, b) => a.localeCompare(b))}
                label="Select Column to pivot on*"
                fieldStyle="transformation"
                onChange={(data: any) => {
                  field.onChange(data);
                  if (data) {
                    const findIndex: number = srcColFields.findIndex(
                      (field) => field.col === data
                    );
                    update(findIndex, {
                      col: srcColFields[findIndex].col,
                      is_checked: false,
                    });
                  }
                }}
              />
            )}
          />
        </Box>
        <GridTable
          headers={['Column values to pivot on']}
          removeItem={(index: number) => remove(index)}
          data={fields.map((field, idx) => [
            <Input
              data-testid={`columnValue${idx}`}
              disabled={action === 'view'}
              fieldStyle="none"
              key={field.col + idx}
              name={`pivot_column_values.${idx}.col`}
              register={register}
              onKeyDown={(e) => {
                // if the key is enter append
                if (e.key === 'Enter') {
                  append({ col: '' });
                }
              }}
            />,
          ])}
        ></GridTable>
        {formState.errors.pivot_column_values && (
          <FormHelperText sx={{ color: 'red', ml: 2 }}>
            {formState.errors.pivot_column_values.root?.message}
          </FormHelperText>
        )}

        <Button
          variant="shadow"
          type="button"
          data-testid="addcase"
          sx={{ m: 2 }}
          onClick={(event) => {
            append({ col: '' });
          }}
        >
          Add row
        </Button>
        <Input
          fieldStyle="transformation"
          sx={{ px: 1, pb: 1 }}
          placeholder="Search by column name"
          onChange={event => handleSearch(event.target.value)}
        />
        <GridTable
          headers={['Columns to groupby']}
          data={[
            ...[
              [
                <Box
                  key={'select_all_box'}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0px 16px',
                  }}
                >
                  <FormControlLabel
                    key={'select_all'}
                    control={
                      <Checkbox
                        checked={selectAllCheckbox}
                        disabled={action === 'view'}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => handleSelectAll(event)
                        }
                      />
                    }
                    label=""
                  />
                  <Typography
                    sx={{
                      fontWeight: '600',
                      fontSize: '14px',
                    }}
                  >
                    Select all
                  </Typography>
                </Box>,
              ],
            ],
            ...colFieldData.map((field, idx) => [
              <Box
                key={field.col + idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0px 16px',
                }}
              >
                <FormControlLabel
                  key={field.id}
                  control={
                    <Checkbox
                      disabled={field.col === pivotColumn || action === 'view'}
                      checked={field.is_checked}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ) => handleUpdate(event, idx)}
                    />
                  }
                  label=""
                />
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  {field.col}
                </Typography>
              </Box>,
            ]),
          ]}
        ></GridTable>
        <Box sx={{m: 2}}/>
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
          <Button
            disabled={action === 'view'}
            variant="contained"
            type="submit"
            data-testid="savebutton"
            fullWidth
            sx={{ marginTop: '17px' }}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default PivotOpForm;

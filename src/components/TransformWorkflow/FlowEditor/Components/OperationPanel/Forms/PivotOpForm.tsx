import React, { useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, Checkbox, FormControlLabel, FormHelperText, Typography } from '@mui/material';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

interface PivotDataConfig {
  groupby_columns: string[];
  pivot_column_name: string;
  pivot_column_values: string[];
  source_columns: string[];
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

  type FormProps = {
    pivot_column_name: string;
    pivot_column_values: {
      col: string;
    }[];
    groupby_columns: { col: string; is_checked: boolean }[];
  };

  const { control, register, handleSubmit, reset, watch, formState, setValue } = useForm<FormProps>(
    {
      defaultValues: {
        pivot_column_name: '',
        pivot_column_values: [
          {
            col: '',
          },
        ],
        groupby_columns: [],
      },
    }
  );

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
    name: 'groupby_columns',
  });

  const fetchAndSetSourceColumns = async () => {
    if (node) {
      setSrcColumns(node.data.output_columns.sort((a: string, b: string) => a.localeCompare(b)));
      setValue(
        'groupby_columns',
        node.data.output_columns
          .sort((a: string, b: string) => a.localeCompare(b))
          .map((col: string) => ({ col: col, is_checked: false }))
      );
      setColFieldData(
        node.data.output_columns
          .sort((a: string, b: string) => a.localeCompare(b))
          .map((col: string) => ({ col: col, is_checked: false }))
      );
    }
  };

  const handleSave = async (data: FormProps) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      const groupbyColumns = data.groupby_columns
        .filter((src_col) => src_col.is_checked)
        .map((src_col) => src_col.col);

      const opConfig: any = {
        pivot_column_name: data.pivot_column_name,
        pivot_column_values: data.pivot_column_values
          .filter((item) => item.col)
          .map((item) => item.col),
        groupby_columns: groupbyColumns,
      };

      setLoading(true);
      // api call
      let operationNode: any;
      if (finalAction === 'create') {
        const payloadData: CreateOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          other_inputs: [],
          config: opConfig,
          input_node_uuid: finalNode?.id || '',
        };
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          payloadData
        );
      } else if (finalAction === 'edit') {
        const payloadData: EditOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          other_inputs: [],
          config: opConfig,
        };

        operationNode = await httpPut(
          session,
          `transform/v2/dbt_project/operations/nodes/${finalNode?.id}/`,
          payloadData
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
      const nodeResponseData: CanvasNodeDataResponse = await httpGet(
        session,
        `transform/v2/dbt_project/nodes/${node?.id}/`
      );
      const { operation_config, input_nodes } = nodeResponseData;

      // form data; will differ based on operations in progress
      const {
        groupby_columns,
        pivot_column_name,
        pivot_column_values,
        source_columns,
      }: PivotDataConfig = operation_config.config;
      setSrcColumns(source_columns.sort((a: string, b: string) => a.localeCompare(b)));

      const groupbySourceColumns = source_columns.map((col) => ({
        col: col,
        is_checked: groupby_columns.includes(col),
      }));

      // pre-fill form
      reset({
        pivot_column_name: pivot_column_name,
        pivot_column_values: pivot_column_values
          .map((col: string) => ({
            col: col,
          }))
          .concat([{ col: '' }]),
        groupby_columns: groupbySourceColumns,
      });
      setColFieldData(groupbySourceColumns);
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
      return stringToSearch?.includes(trimmedSubstring);
    });
    setColFieldData(filteredColumns);
  };

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

    setColFieldData(updatedFields);

    // Merge the updated fields with the original unpivotColFields
    const mergedFields = srcColFields.map(
      (field) => updatedFields.find((updatedField) => updatedField.col === field.col) || field
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
        };
      }
      return colField;
    });
    const originalIndex = srcColFields?.findIndex((colField) => colField.col == field.col);

    update(originalIndex, {
      col: field.col,
      is_checked: event.target.checked,
    });
    setColFieldData(updatedFields);
  };

  useEffect(() => {
    if (node?.data.isDummy) return;
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  useEffect(() => {
    if (colFieldData?.length > 0) {
      let selectAll = true;
      colFieldData?.forEach((colField) => {
        if (!colField.is_checked) selectAll = false;
      });
      setSelectAllCheckbox(selectAll);
    }
  }, [colFieldData]);

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
                    const findIndex: number = srcColFields.findIndex((field) => field.col === data);
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
          onChange={(event) => handleSearch(event.target.value)}
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
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          handleSelectAll(event)
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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdate(event, idx)
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
                  {field.col}
                </Typography>
              </Box>,
            ]),
          ]}
        ></GridTable>
        <Box sx={{ m: 2 }} />
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

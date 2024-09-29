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
import { useFieldArray, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import Input from '@/components/UI/Input/Input';

interface UnpivotDataConfig {
  source_columns: string[];
  exclude_columns: string[];
  unpivot_columns: string[];
  unpivot_field_name: string;
  unpivot_value_name: string;
}

const UnpivotOpForm = ({
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
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [colFieldData, setColFieldData] = useState<any[]>([]);
  const [selectAllCheckbox, setSelectAllCheckbox] = useState<{
    is_unpivot: boolean;
    is_exclude: boolean;
  }>({ is_unpivot: false, is_exclude: false });
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
        ? (node?.data as OperationNodeData)
        : {};

  type FormProps = {
    unpivot_field_name: string;
    unpivot_value_name: string;
    unpivot_columns: {
      col: string;
      is_unpivot_checked: boolean;
      is_exclude_checked: boolean;
    }[];
  };

  const { control, handleSubmit, reset, setValue, setError, formState } =
    useForm<FormProps>({
      defaultValues: {
        unpivot_field_name: 'col_name',
        unpivot_value_name: 'value',
        unpivot_columns: [],
      },
    });

  const {
    fields: unpivotColFields,
    replace: unpivotColReplace,
    update: unpivotColUpdate,
  } = useFieldArray({
    control,
    name: 'unpivot_columns',
    rules: {},
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
        const unpivot_col_fields = data
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((col: ColumnData) => ({
            col: col.name,
            is_unpivot_checked: false,
            is_exclude_checked: false,
          }));
        setValue('unpivot_columns', unpivot_col_fields);
        setColFieldData(unpivot_col_fields);
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setSrcColumns(nodeData.output_cols);
    }
  };

  const handleSave = async (data: FormProps) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        config: {
          unpivot_columns: data.unpivot_columns
            .filter((col) => col.is_unpivot_checked)
            .map((col) => col.col),
          unpivot_field_name: data.unpivot_field_name,
          unpivot_value_name: data.unpivot_value_name,
          exclude_columns: data.unpivot_columns
            .filter((col) => col.is_exclude_checked)
            .map((col) => col.col),
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      // validate form errors
      if (postData.config.unpivot_columns.length === 0) {
        setError('unpivot_columns', {
          type: 'manual',
          message: 'Atleast one column required to unpivot',
        });
        return;
      }

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
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const {
        source_columns,
        exclude_columns,
        unpivot_columns,
        unpivot_field_name,
        unpivot_value_name,
      }: UnpivotDataConfig = opConfig;
      setSrcColumns(source_columns);

      const orginalSrcColumns = source_columns.sort((a, b) =>
        a.localeCompare(b)
      );

      const unpivot_col_fields = orginalSrcColumns.map((col: string) => ({
        col,
        is_unpivot_checked: unpivot_columns.includes(col),
        is_exclude_checked: exclude_columns.includes(col),
      }));

      // pre-fill form
      reset({
        unpivot_field_name: unpivot_field_name,
        unpivot_value_name: unpivot_value_name,
        unpivot_columns: unpivot_col_fields,
      });

      setColFieldData(unpivot_col_fields);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const trimmedSubstring = value?.toLowerCase();
    const filteredColumns = unpivotColFields?.filter((colField) => {
      const stringToSearch = colField?.col?.toLowerCase();
      return stringToSearch?.includes(trimmedSubstring);
    });
    setColFieldData(filteredColumns);
  };

  const handleSelectAll = (
    event: React.ChangeEvent<HTMLInputElement>,
    is_exclude: boolean
  ) => {
    // Filter the fields based on the search results stored in colFieldData
    const filteredFields = unpivotColFields.filter((field) =>
      colFieldData.some((colField) => colField.col === field.col)
    );

    // Update the filtered fields based on the select all checkbox
    const updatedFields = filteredFields.map((field) => ({
      col: field.col,
      is_unpivot_checked: is_exclude
        ? event.target.checked
          ? false
          : field.is_unpivot_checked
        : event.target.checked,
      is_exclude_checked: is_exclude
        ? event.target.checked
        : event.target.checked
          ? false
          : field.is_exclude_checked,
    }));

    setColFieldData(updatedFields);

    // Merge the updated fields with the original unpivotColFields
    const mergedFields = unpivotColFields.map(
      (field) =>
        updatedFields.find((updatedField) => updatedField.col === field.col) ||
        field
    );

    unpivotColReplace(mergedFields);
  };

  const handleUnpivotColUpdate = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
    is_exclude: boolean
  ) => {
    const field = colFieldData[index];
    const updatedFields = colFieldData.map((colField) => {
      if (colField.col == field.col) {
        return {
          col: field.col,
          is_unpivot_checked: is_exclude
            ? event.target.checked
              ? false
              : field.is_unpivot_checked
            : event.target.checked,
          is_exclude_checked: is_exclude
            ? event.target.checked
            : event.target.checked
              ? false
              : field.is_exclude_checked,
        };
      }
      return colField;
    });
    const originalIndex = unpivotColFields?.findIndex(
      (colField) => colField.col == field.col
    );

    unpivotColUpdate(originalIndex, {
      col: field.col,
      is_unpivot_checked: is_exclude
        ? event.target.checked
          ? false
          : field.is_unpivot_checked
        : event.target.checked,
      is_exclude_checked: is_exclude
        ? event.target.checked
        : event.target.checked
          ? false
          : field.is_exclude_checked,
    });
    setColFieldData(updatedFields);
  };

  useEffect(() => {
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  useEffect(() => {
    if (colFieldData?.length > 0) {
      const selectAll = { is_exclude: true, is_unpivot: true };
      colFieldData?.forEach((colField) => {
        if (!colField.is_exclude_checked) selectAll.is_exclude = false;
        if (!colField.is_unpivot_checked) selectAll.is_unpivot = false;
      });
      setSelectAllCheckbox(selectAll);
    }
  }, [colFieldData]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Input
          fieldStyle="transformation"
          sx={{ px: 1, pb: 1 }}
          placeholder="Search by column name"
          onChange={(event) => handleSearch(event.target.value)}
        />
        <GridTable
          headers={['Columns to unpivot']}
          data={[
            ...[
              [
                <Box
                  key="selectAll"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0px 16px',
                  }}
                >
                  <FormControlLabel
                    key="select_all_unpivot"
                    control={
                      <Checkbox
                        checked={selectAllCheckbox.is_unpivot}
                        disabled={action === 'view'}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          handleSelectAll(event, false);
                          setSelectAllCheckbox({
                            is_unpivot: event.target.checked,
                            is_exclude: event.target.checked
                              ? false
                              : selectAllCheckbox.is_exclude,
                          });
                        }}
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
                      data-testid={`unpivotColumn${idx}`}
                      disabled={action === 'view'}
                      checked={field.is_unpivot_checked}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ) => {
                        handleUnpivotColUpdate(event, idx, false);
                      }}
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
        {formState.errors?.unpivot_columns?.message && (
          <FormHelperText sx={{ color: 'red', ml: 2 }}>
            {formState.errors?.unpivot_columns?.message}
          </FormHelperText>
        )}
        <Box sx={{ mb: 2 }}></Box>
        <GridTable
          headers={['Columns to keep in output table']}
          data={[
            ...[
              [
                <Box
                  key="select_all_exclude_box"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0px 16px',
                  }}
                >
                  <FormControlLabel
                    key="select_all_exclude"
                    control={
                      <Checkbox
                        checked={selectAllCheckbox.is_exclude}
                        disabled={action === 'view'}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          setSelectAllCheckbox({
                            is_unpivot: event.target.checked
                              ? false
                              : selectAllCheckbox.is_unpivot,
                            is_exclude: event.target.checked,
                          });
                          handleSelectAll(event, true);
                        }}
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
                      disabled={action === 'view'}
                      checked={field.is_exclude_checked}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ) => {
                        handleUnpivotColUpdate(event, idx, true);
                      }}
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

export default UnpivotOpForm;

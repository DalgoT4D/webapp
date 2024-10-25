import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, Checkbox, FormControlLabel, FormHelperText, Typography } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { useFieldArray, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import Input from '@/components/UI/Input/Input';
import { useOpForm } from '@/customHooks/useOpForm';

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
  const [searchUnpivot, setSearchUnpivot] = useState(''); // Search value for unpivot
  const [searchExclude, setSearchExclude] = useState(''); // Search value for exclude
  const [selectAllCheckbox, setSelectAllCheckbox] = useState<{
    is_unpivot: boolean;
    is_exclude: boolean;
  }>({ is_unpivot: false, is_exclude: false });
  const { parentNode, nodeData } = useOpForm({
    props: {
      node,
      operation,
      sx,
      continueOperationChain,
      action,
      setLoading,
    },
  });

  type FormProps = {
    unpivot_field_name: string;
    unpivot_value_name: string;
    unpivot_columns: {
      col: string;
      is_unpivot_checked: boolean;
      is_exclude_checked: boolean;
    }[];
  };

  const { control, handleSubmit, reset, setValue, setError, formState } = useForm<FormProps>({
    defaultValues: {
      unpivot_field_name: 'col_name',
      unpivot_value_name: 'value',
      unpivot_columns: [],
    },
  });

  const {
    fields: unpivotColFields, // use this as the central state
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
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setSrcColumns(nodeData.output_cols);
    }
  };

  const handleSave = async (data: FormProps) => {
    const finalNode = node?.data.isDummy ? parentNode : node; //change  //this checks for edit case too.
    const finalAction = node?.data.isDummy ? 'create' : action;
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
        input_uuid: finalNode?.type === SRC_MODEL_NODE ? finalNode?.id : '',
        target_model_uuid: finalNode?.data.target_model_id || '',
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
      if (finalAction === 'create') {
        operationNode = await httpPost(session, `transform/dbt_project/model/`, postData);
      } else if (finalAction === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid ? inputModels[0].uuid : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${finalNode?.id}/`,
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

      const orginalSrcColumns = source_columns.sort((a, b) => a.localeCompare(b));

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUnpivot = (value: string) => {
    setSearchUnpivot(value.toLowerCase());
  };

  const handleSearchExclude = (value: string) => {
    setSearchExclude(value.toLowerCase());
  };

  // Filtered lists for both unpivot and exclude based on search terms
  const filteredUnpivotColumns = unpivotColFields.filter((col) =>
    col.col.toLowerCase().includes(searchUnpivot)
  );
  const filteredExcludeColumns = unpivotColFields.filter((col) =>
    col.col.toLowerCase().includes(searchExclude)
  );

  const handleUnpivotColUpdate = (
    event: React.ChangeEvent<HTMLInputElement>,
    columnName: string,
    is_exclude: boolean
  ) => {
    const updatedFields = unpivotColFields.map((colField) => {
      if (colField.col === columnName) {
        return {
          ...colField,
          is_unpivot_checked: is_exclude
            ? event.target.checked
              ? false
              : colField.is_unpivot_checked
            : event.target.checked,
          is_exclude_checked: is_exclude
            ? event.target.checked
            : event.target.checked
              ? false
              : colField.is_exclude_checked,
        };
      }
      return colField;
    });
    unpivotColReplace(updatedFields); // Replace the entire array with updated values
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>, is_exclude: boolean) => {
    const updatedFields = unpivotColFields.map((field) => ({
      col: field.col,
      is_unpivot_checked: is_exclude ? false : event.target.checked,
      is_exclude_checked: is_exclude ? event.target.checked : false,
    }));
    unpivotColReplace(updatedFields);
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
    if (unpivotColFields?.length > 0) {
      const selectAll = { is_exclude: true, is_unpivot: true };
      unpivotColFields?.forEach((colField) => {
        if (!colField.is_exclude_checked) selectAll.is_exclude = false;
        if (!colField.is_unpivot_checked) selectAll.is_unpivot = false;
      });
      setSelectAllCheckbox(selectAll);
    }
  }, [unpivotColFields]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Input
          fieldStyle="transformation"
          sx={{ px: 1, pb: 1 }}
          placeholder="Search by column name for unpivot"
          onChange={(event) => handleSearchUnpivot(event.target.value)}
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
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          handleSelectAll(event, false);
                          setSelectAllCheckbox({
                            is_unpivot: event.target.checked,
                            is_exclude: event.target.checked ? false : selectAllCheckbox.is_exclude,
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
            ...filteredUnpivotColumns.map((field, idx) => [
              <Box
                key={field.col}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0px 16px',
                }}
              >
                <FormControlLabel
                  key={field.id + idx}
                  control={
                    <Checkbox
                      data-testid={`unpivotColumn${idx}`}
                      disabled={action === 'view'}
                      checked={field.is_unpivot_checked}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        handleUnpivotColUpdate(event, field.col, false);
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

        {/* Second Search bar for "Columns to keep in output table" */}
        <Input
          fieldStyle="transformation"
          sx={{ px: 1, pb: 1 }}
          placeholder="Search by column name in output"
          onChange={(event) => handleSearchExclude(event.target.value)}
        />
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
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setSelectAllCheckbox({
                            is_unpivot: event.target.checked ? false : selectAllCheckbox.is_unpivot,
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
            ...filteredExcludeColumns.map((field, idx) => [
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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        handleUnpivotColUpdate(event, field.col, true);
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

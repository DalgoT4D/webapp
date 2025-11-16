import React, { Fragment, useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText, Grid, SxProps, Typography } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { AggregateOn, AggregateOperations } from './AggregationOpForm';
import { useOpForm } from '@/customHooks/useOpForm';

const renameGridStyles: {
  container: SxProps;
  headerItem: SxProps;
  item: SxProps;
} = {
  container: {
    border: '1px solid #F9F9F9',
    color: '#5E5E5E',
  },
  headerItem: {
    background: '#EEF3F3',
    padding: '9px 16px 9px 16px',
  },
  item: {
    background: '#EEF3F3',
    border: '1px solid #F9F9F9',
    padding: '9px 16px 9px 16px',
  },
};

interface GroupbyDataConfig {
  aggregate_on: AggregateOn[];
  source_columns: string[];
  other_inputs: any[];
}

const GroupByOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const globalContext = useContext(GlobalContext);
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
    columns: { col: string }[];
    aggregate_on: {
      metric: string;
      aggregate_func: { id: string; label: string };
      output_column_name: string;
    }[];
  };

  const { control, handleSubmit, reset, watch, formState } = useForm<FormProps>({
    defaultValues: {
      columns: [{ col: '' }],
      aggregate_on: [
        {
          metric: '',
          aggregate_func: { id: '', label: '' },
          output_column_name: '',
        },
      ],
    },
  });
  // Include this for multi-row input
  const {
    fields: dimensionFields,
    append: appendDimension,
    remove: removeDimension,
  } = useFieldArray({
    control,
    name: 'columns',
    rules: {
      minLength: { value: 2, message: 'Atleast 1 column is required' },
    },
  });
  const {
    fields: aggregateFields,
    append: appendAggregate,
    remove: removeAggregate,
  } = useFieldArray({
    control,
    name: 'aggregate_on',
  });

  const columns = watch('columns'); // Get the current form values

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      //change
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name).sort((a, b) => a.localeCompare(b)));
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
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      const dimensionColumns = data.columns
        .filter((col: any) => (col.col ? true : false))
        .map((col: any) => col.col);

      const postData: any = {
        op_type: operation.slug,
        source_columns: dimensionColumns,
        other_inputs: [],
        config: {
          aggregate_on: data.aggregate_on
            .filter((item: any) => item.metric && item.aggregate_func.id && item.output_column_name)
            .map((item: any) => ({
              column: item.metric,
              operation: item.aggregate_func.id,
              output_column_name: item.output_column_name,
            })),
        },
        input_node_uuid:
          finalNode?.type === SRC_MODEL_NODE
            ? finalNode?.id
            : finalNode?.data.target_model_id || '',
      };

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          postData
        );
      } else if (finalAction === 'edit') {
        // For v2 edit, transform other_inputs if they exist
        if (inputModels.length > 0) {
          postData.other_inputs = inputModels.map((model: any, index: number) => ({
            input_node_uuid: model.uuid,
            columns: model.columns || [],
            seq: index + 1,
          }));
        }
        operationNode = await httpPut(
          session,
          `transform/v2/dbt_project/operations/nodes/${finalNode?.id}/`,
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
        `transform/v2/dbt_project/operations/nodes/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const { source_columns, aggregate_on }: GroupbyDataConfig = opConfig;
      if (prev_source_columns) setSrcColumns(prev_source_columns);

      // pre-fill form
      const dimensionColumns = source_columns.map((col: string) => ({
        col: col,
      }));
      dimensionColumns.push({ col: '' });
      reset({
        columns: dimensionColumns,
        aggregate_on: aggregate_on.map((item: AggregateOn) => ({
          metric: item.column,
          aggregate_func: AggregateOperations.find((op) => op.id === item.operation),
          output_column_name: item.output_column_name,
        })),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (node?.data.isDummy) return;
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container sx={{ ...renameGridStyles.container }}>
          <Grid item xs={12} sx={{ ...renameGridStyles.headerItem }}>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '12px',
                lineHeight: '19.2px',
                letterSpacing: '2%',
              }}
            >
              Select dimensios
            </Typography>
          </Grid>

          {dimensionFields.map((field, index) => (
            <Fragment key={field + '_1'}>
              <Grid key={field + '_1'} item xs={2} sx={{ ...renameGridStyles.item }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: '600',
                      fontSize: '12px',
                      lineHeight: '19.2px',
                      letterSpacing: '2%',
                    }}
                  >
                    {index + 1}
                  </Typography>
                </Box>
              </Grid>

              <Grid
                key={field + '_2'}
                item
                xs={10}
                sx={{ ...renameGridStyles.item, background: 'none' }}
              >
                <Controller
                  control={control}
                  name={`columns.${index}.col`}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      data-testid={`columns${index}`}
                      disabled={action === 'view'}
                      fieldStyle="transformation"
                      options={srcColumns?.filter(
                        (option) => !columns.map((col) => col.col).includes(option)
                      )}
                      onChange={(data: any) => {
                        field.onChange(data);
                        if (data) appendDimension({ col: '' });
                        else removeDimension(index + 1);
                      }}
                    />
                  )}
                />
              </Grid>
            </Fragment>
          ))}
        </Grid>
        {formState.errors.columns && (
          <FormHelperText sx={{ color: 'red', ml: 3 }}>
            {formState.errors.columns.root?.message}
          </FormHelperText>
        )}

        <Box sx={{ padding: '32px 16px 0px 16px' }}>
          {aggregateFields.map((field, index) => (
            <Box key={`${field.id}_box`}>
              <Box>
                <Typography fontWeight="600" color="#888888">
                  ADD AGGREGATION {(index + 1).toString().padStart(2, '0')}
                </Typography>
              </Box>
              <Controller
                key={`${field.id}_metric`}
                control={control}
                rules={{ required: 'Metric is required' }}
                name={`aggregate_on.${index}.metric`}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    {...field}
                    data-testid="metric"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={action === 'view'}
                    options={srcColumns}
                    label="Select metric*"
                    fieldStyle="transformation"
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
              <Controller
                key={`${field.id}_aggregate_func`}
                control={control}
                rules={{
                  validate: (value) => value.id !== '' || 'Aggregate function is required',
                }}
                name={`aggregate_on.${index}.aggregate_func`}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    {...field}
                    data-testid="aggregation"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={action === 'view'}
                    options={AggregateOperations}
                    isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
                    label="Select aggregation*"
                    fieldStyle="transformation"
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
              <Controller
                control={control}
                rules={{ required: 'Output column name is required' }}
                name={`aggregate_on.${index}.output_column_name`}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fieldStyle="transformation"
                    label="Output Column Name*"
                    disabled={action === 'view'}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
              {index === aggregateFields.length - 1 ? (
                <Button
                  variant="outlined"
                  type="button"
                  data-testid="addoperand"
                  sx={{ marginTop: '17px' }}
                  disabled={action === 'view'}
                  onClick={(event) =>
                    appendAggregate({
                      metric: '',
                      aggregate_func: { id: '', label: '' },
                      output_column_name: '',
                    })
                  }
                >
                  Add aggregation
                </Button>
              ) : (
                <Button
                  variant="contained"
                  type="button"
                  data-testid="removeoperand"
                  sx={{ marginTop: '17px' }}
                  onClick={(event) => removeAggregate(index)}
                  disabled={action === 'view'}
                >
                  Remove aggregation
                </Button>
              )}
              <Box sx={{ m: 2 }} />
            </Box>
          ))}

          <Box sx={{ m: 2 }} />
          <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
            <Button
              variant="outlined"
              type="submit"
              data-testid="savebutton"
              fullWidth
              sx={{ marginTop: '17px' }}
              disabled={action === 'view'}
            >
              Save
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default GroupByOpForm;

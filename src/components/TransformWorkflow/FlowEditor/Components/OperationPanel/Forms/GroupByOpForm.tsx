import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  SxProps,
  TextField,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';

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
    background: '#F9F9F9',
    padding: '9px 16px 9px 16px',
  },
  item: {
    background: '#F9F9F9',
    border: '1px solid #F9F9F9',
    padding: '9px 16px 9px 16px',
  },
};

const GroupByOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    columns: { col: string }[];
    aggregate_on: {
      metric: string;
      aggregate_func: { id: string; label: string };
      output_col_name: string;
    }[];
  };

  const { control, register, handleSubmit, reset, watch } = useForm<FormProps>({
    defaultValues: {
      columns: [{ col: '' }],
      aggregate_on: [
        {
          metric: '',
          aggregate_func: { id: '', label: '' },
          output_col_name: '',
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
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
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
      const dimensionColumns = data.columns
        .map((col: any) => col.col)
        .filter((col: string) => col);
      if (dimensionColumns.length === 0) {
        errorToast('Please select dimensions to groupby', [], globalContext);
      }
      const postData: any = {
        op_type: operation.slug,
        source_columns: dimensionColumns,
        other_inputs: [],
        config: {
          aggregate_on: data.aggregate_on.map((item: any) => ({
            column: item.metric,
            operation: item.aggregate_func.id,
            output_col_name: item.output_col_name,
          })),
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      // api call
      const operationNode: any = await httpPost(
        session,
        `transform/dbt_project/model/`,
        postData
      );

      continueOperationChain(operationNode);
      reset();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAndSetSourceColumns();
  }, [session]);

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
            <>
              <Grid
                key={field + '_1'}
                item
                xs={2}
                sx={{ ...renameGridStyles.item }}
              >
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
                      options={srcColumns.filter(
                        (option) =>
                          !columns.map((col) => col.col).includes(option)
                      )}
                      //   value={field.value}
                      onChange={(e, data) => {
                        field.onChange(data);
                        if (data) appendDimension({ col: '' });
                        else removeDimension(index + 1);
                      }}
                      renderInput={(params) => (
                        <Input {...params} sx={{ width: '100%' }} />
                      )}
                    />
                  )}
                />
              </Grid>
            </>
          ))}
        </Grid>

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
                name={`aggregate_on.${index}.metric`}
                render={({ field }) => (
                  <Autocomplete
                    sx={{ paddingTop: '15px' }}
                    options={srcColumns}
                    //   value={field.value}
                    onChange={(e, data) => {
                      field.onChange(data);
                    }}
                    renderInput={(params) => (
                      <Input
                        {...params}
                        sx={{ width: '100%' }}
                        label="Select metric"
                      />
                    )}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
              <Controller
                key={`${field.id}_aggregate_func`}
                control={control}
                name={`aggregate_on.${index}.aggregate_func`}
                render={({ field }) => (
                  <Autocomplete
                    options={[
                      {
                        id: 'sum',
                        label: 'Sum',
                      },
                      {
                        id: 'avg',
                        label: 'Average',
                      },
                      {
                        id: 'count',
                        label: 'Count values',
                      },
                      {
                        id: 'min',
                        label: 'Minimum',
                      },
                      {
                        id: 'max',
                        label: 'Maximum',
                      },
                      {
                        id: 'countdistinct',
                        label: 'Count distinct values',
                      },
                    ]}
                    isOptionEqualToValue={(option: any, value: any) =>
                      option?.id === value?.id
                    }
                    value={field.value}
                    onChange={(e, data) => {
                      if (data) field.onChange(data);
                    }}
                    renderInput={(params) => (
                      <Input
                        {...params}
                        sx={{ width: '100%' }}
                        label="Select aggregation"
                      />
                    )}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
              <Input
                label="Output Column Name"
                name={`aggregate_on.${index}.output_col_name`}
                register={register}
                required
              />
              <Box sx={{ m: 2 }} />
              {index === aggregateFields.length - 1 ? (
                <Button
                  variant="outlined"
                  type="button"
                  data-testid="addoperand"
                  sx={{ marginTop: '17px' }}
                  onClick={(event) =>
                    appendAggregate({
                      metric: 'col',
                      aggregate_func: { id: '', label: '' },
                      output_col_name: '',
                    })
                  }
                >
                  Add aggregation
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  type="button"
                  data-testid="removeoperand"
                  sx={{ marginTop: '17px' }}
                  onClick={(event) => removeAggregate(index)}
                >
                  Remove aggregation
                </Button>
              )}
              <Box sx={{ m: 2 }} />
            </Box>
          ))}

          <Box sx={{ m: 2 }} />
          <Box>
            <Button
              variant="outlined"
              type="submit"
              data-testid="savebutton"
              fullWidth
              sx={{ marginTop: '17px' }}
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

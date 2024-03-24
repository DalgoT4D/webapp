import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, Grid, SxProps, Typography } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';

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

const CoalesceOpForm = ({
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

  const { control, register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      columns: [{ col: '' }],
      default_value: '',
      output_column_name: '',
    },
  });
  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'columns',
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

  const handleSave = async (data: any) => {
    try {
      const coalesceColumns = data.columns
        .map((col: any) => col.col)
        .filter((col: string) => col);
      if (coalesceColumns.length === 0) {
        errorToast('Please select columns to coalesce', [], globalContext);
      }
      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: {
          columns: coalesceColumns,
          default_value: data.default_value,
          output_column_name: data.output_column_name,
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
              Columns
            </Typography>
          </Grid>

          {fields.map((field, index) => (
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
                      fieldStyle="transformation"
                      options={srcColumns.filter(
                        (option) =>
                          !columns.map((col) => col.col).includes(option)
                      )}
                      //   value={field.value}
                      onChange={(e, data) => {
                        field.onChange(data);
                        if (data) append({ col: '' });
                        else remove(index + 1);
                      }}
                    />
                  )}
                />
              </Grid>
            </>
          ))}
        </Grid>
        <Box sx={{ padding: '32px 16px 0px 16px' }}>
          <Input
            fieldStyle="transformation"
            label="Default Value"
            sx={{ padding: '0' }}
            name="default_value"
            register={register}
            required
          />
          <Box sx={{ m: 2 }} />
          <Input
            fieldStyle="transformation"
            label="Output Column Name"
            sx={{ padding: '0' }}
            name="output_column_name"
            register={register}
            required
          />
          <Box sx={{ m: 2 }} />
          <Box>
            <Button
              variant="contained"
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

export default CoalesceOpForm;

import React, { Fragment, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText, FormLabel, Grid, SxProps, Typography } from '@mui/material';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import {
  CanvasNodeDataResponse,
  CanvasNodeTypeEnum,
  CreateOperationNodePayload,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

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
    border: '1px solid #EEF3F3',
    padding: '9px 16px 9px 16px',
  },
};

interface CoalesceDataConfig {
  columns: string[];
  source_columns: string[];
  default_value: string;
  other_inputs: any[];
  output_column_name: string;
}

const CoalesceOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);

  const { control, handleSubmit, reset, getValues, formState } = useForm({
    defaultValues: {
      columns: [{ col: null }] as Array<{ col: string | null }>,
      default_value: '',
      output_column_name: '',
    },
  });
  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'columns',
    rules: {
      minLength: {
        value: 2,
        message: 'Atleast 1 column is required',
      },
    },
  });

  const { columns } = getValues();

  const fetchAndSetSourceColumns = async () => {
    if (node) {
      if (
        [CanvasNodeTypeEnum.Model.toString(), CanvasNodeTypeEnum.Source.toString()].includes(
          node.type
        )
      ) {
        try {
          if (node.data.dbtmodel) {
            const data: ColumnData[] = await httpGet(
              session,
              `warehouse/table_columns/${node.data.dbtmodel.schema}/${node.data.dbtmodel.name}`
            );
            setSrcColumns(data.map((col: ColumnData) => col.name));
          }
        } catch (error) {
          console.log(error);
        }
      }

      if (node.type === CanvasNodeTypeEnum.Operation.toString()) {
        setSrcColumns(node.data.output_columns);
      }
    }
  };

  const handleSave = async (data: any) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      let opConfig: any = {
        columns: data.columns.map((col: any) => col.col).filter((col: string) => col),
        default_value: data.default_value,
        output_column_name: data.output_column_name,
      };

      // api call
      setLoading(true);
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
    } catch (error) {
      console.log(error);
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
      const { source_columns, columns, output_column_name, default_value }: CoalesceDataConfig =
        operation_config.config;
      setSrcColumns(source_columns);

      // pre-fill form
      const coalesceColumns = columns.map((col: string | null) => ({
        col: col,
      }));
      coalesceColumns.push({ col: null });
      reset({
        columns: coalesceColumns,
        default_value: default_value,
        output_column_name: output_column_name,
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
              Columns
            </Typography>
          </Grid>

          {fields.map((field, index) => (
            <Fragment key={field.id}>
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
                      data-testid={`column${index}`}
                      disabled={action === 'view'}
                      fieldStyle="transformation"
                      options={srcColumns
                        .filter((option) => !columns.map((col) => col.col).includes(option))
                        .sort((a, b) => a.localeCompare(b))}
                      onChange={(data: any) => {
                        field.onChange(data);
                        if (data) append({ col: null });
                        else remove(index + 1);
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormLabel sx={{ mr: 1, color: 'black' }}>Default Value*</FormLabel>
            <Box sx={{ display: 'inline-block' }}>
              <InfoTooltip title={'Output if all values in a row are null'} />
            </Box>
          </Box>
          <Controller
            control={control}
            rules={{ required: 'Default value is required' }}
            name="default_value"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                data-testid="defaultValue"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label=""
                sx={{ padding: '0' }}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Controller
            control={control}
            rules={{ required: 'Output column name is required' }}
            name="output_column_name"
            render={({ field, fieldState }) => (
              <Input
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                {...field}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label="Output Column Name*"
                sx={{ padding: '0' }}
              />
            )}
          />
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
        </Box>
      </form>
    </Box>
  );
};

export default CoalesceOpForm;

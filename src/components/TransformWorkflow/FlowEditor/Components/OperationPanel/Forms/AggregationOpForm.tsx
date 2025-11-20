import React, { useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  DbtModelResponse,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

export interface AggregateOn {
  column: string;
  operation: 'sum' | 'avg' | 'count' | 'countdistinct' | 'max' | 'min';
  output_column_name: string;
}
interface AggregateDataConfig {
  aggregate_on: AggregateOn[];
  source_columns: string[];
  other_inputs: any[];
}

export const AggregateOperations = [
  { id: 'avg', label: 'Average' },
  { id: 'count', label: 'Count' },
  { id: 'countdistinct', label: 'Count Distinct' },
  { id: 'max', label: 'Maximum' },
  { id: 'min', label: 'Minimum' },
  { id: 'sum', label: 'Sum' },
].sort((a, b) => a.label.localeCompare(b.label));

const AggregationOpForm = ({
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

  type FormProps = {
    aggregate_on: {
      column: string | null;
      operation: { id: string; label: string } | null;
      output_column_name: string;
    }[];
  };

  const { control, handleSubmit, reset } = useForm<FormProps>({
    defaultValues: {
      aggregate_on: [
        {
          column: null,
          operation: null,
          output_column_name: '',
        },
      ],
    },
  });
  // Include this for multi-row input
  const { fields } = useFieldArray({
    control,
    name: 'aggregate_on',
  });

  const fetchAndSetSourceColumns = async () => {
    if (node) {
      setSrcColumns(node.data.output_columns);
    }
  };

  const handleSave = async (data: FormProps) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action;
    try {
      const opConfig: any = {
        aggregate_on: data.aggregate_on.map((item) => ({
          operation: item.operation?.id,
          column: item.column,
          output_column_name: item.output_column_name,
        })),
      };

      setLoading(true);
      // api call
      let operationNode: any;
      if (finalAction === 'create') {
        const payloadData: CreateOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          config: opConfig,
          input_node_uuid: finalNode?.id || '',
          other_inputs: [],
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
          config: opConfig,
          other_inputs: [],
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
      const nodeResponeData: CanvasNodeDataResponse = await httpGet(
        session,
        `transform/v2/dbt_project/nodes/${node?.id}/`
      );
      const { operation_config, input_nodes } = nodeResponeData;

      // form data; will differ based on operations in progress
      const { source_columns, aggregate_on }: AggregateDataConfig = operation_config.config;
      setSrcColumns(source_columns);

      // pre-fill form
      reset({
        aggregate_on: aggregate_on.map((item: AggregateOn) => ({
          column: item.column,
          operation: AggregateOperations.find((op) => op.id === item.operation),
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
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        {fields.map((field, index) => (
          <Box key={field.id}>
            <Controller
              control={control}
              rules={{ required: 'Column to aggregate is required' }}
              name={`aggregate_on.${index}.column`}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  data-testid="aggregateColumn"
                  disabled={action === 'view'}
                  fieldStyle="transformation"
                  options={srcColumns.sort((a, b) => a.localeCompare(b))}
                  label="Select Column to Aggregate*"
                  helperText={fieldState.error?.message}
                  error={!!fieldState.error}
                />
              )}
            />

            <Box sx={{ mt: 2 }}>
              <Controller
                control={control}
                rules={{
                  validate: (value) => {
                    return (value && value?.id !== '') || 'Operation is required';
                  },
                }}
                name={`aggregate_on.${index}.operation`}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    disabled={action === 'view'}
                    data-testid="operation"
                    options={AggregateOperations}
                    isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
                    {...field}
                    helperText={fieldState.error?.message}
                    error={!!fieldState.error}
                    label="Aggregate*"
                    fieldStyle="transformation"
                  />
                )}
              />
            </Box>
            <Controller
              control={control}
              rules={{ required: 'Output column name is required' }}
              name={`aggregate_on.${index}.output_column_name`}
              render={({ field, fieldState }) => (
                <Input
                  fieldStyle="transformation"
                  label="Output Column Name*"
                  sx={{ padding: '0', marginTop: '16px' }}
                  helperText={fieldState.error?.message}
                  error={!!fieldState.error}
                  disabled={action === 'view'}
                  {...field}
                />
              )}
            />
          </Box>
        ))}
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

export default AggregationOpForm;

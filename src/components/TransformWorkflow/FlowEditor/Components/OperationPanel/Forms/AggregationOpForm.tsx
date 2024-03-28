import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
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
  clearAndClosePanel,
  dummyNodeId,
  action,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    aggregate_on: {
      column: string;
      operation: { id: string; label: string };
      output_column_name: string;
    }[];
  };

  const { control, register, handleSubmit, reset } = useForm<FormProps>({
    defaultValues: {
      aggregate_on: [
        {
          column: '',
          operation: { id: '', label: '' },
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
      if (data.aggregate_on.length === 0) {
        errorToast('Please select columns to aggregate', [], globalContext);
        return;
      }

      if (!data.aggregate_on[0].column) {
        errorToast(
          'Please select the column to aggregate on',
          [],
          globalContext
        );
        return;
      }

      if (!data.aggregate_on[0].operation) {
        errorToast('Please select an operation', [], globalContext);
        return;
      }

      if (!data.aggregate_on[0].output_column_name) {
        errorToast('Please enter the output name', [], globalContext);
        return;
      }

      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        config: {
          aggregate_on: data.aggregate_on.map((item) => ({
            operation: item.operation.id,
            column: item.column,
            output_column_name: item.output_column_name,
          })),
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

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
    }
  };

  const fetchAndSetConfigForEdit = async () => {
    try {
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      let { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      let { source_columns, aggregate_on }: AggregateDataConfig = opConfig;
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
    }
  };

  useEffect(() => {
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        {fields.map((field, index) => (
          <Box key={field.id}>
            <Controller
              control={control}
              name={`aggregate_on.${index}.column`}
              render={({ field }) => (
                <Autocomplete
                  disabled={action === 'view'}
                  fieldStyle="transformation"
                  options={srcColumns.sort((a, b) => a.localeCompare(b))}
                  value={field.value}
                  onChange={(e, data) => {
                    if (data) field.onChange(data);
                  }}
                  label="Select Column to Aggregate*"
                />
              )}
            />

            <Box sx={{ mt: 2 }}>
              <Controller
                control={control}
                name={`aggregate_on.${index}.operation`}
                render={({ field }) => (
                  <Autocomplete
                    disabled={action === 'view'}
                    options={AggregateOperations}
                    isOptionEqualToValue={(option: any, value: any) =>
                      option?.id === value?.id
                    }
                    value={field.value}
                    onChange={(e, data: any) => {
                      if (data) field.onChange(data);
                    }}
                    label="Aggregate*"
                    fieldStyle="transformation"
                  />
                )}
              />
            </Box>
            <Input
              fieldStyle="transformation"
              label="Output Column Name*"
              sx={{ padding: '0', marginTop: '16px' }}
              name={`aggregate_on.${index}.output_column_name`}
              register={register}
              disabled={action === 'view'}
            />
          </Box>
        ))}
        <Box>
          <Box sx={{ m: 2 }} />
          <Box>
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

export default AggregationOpForm;

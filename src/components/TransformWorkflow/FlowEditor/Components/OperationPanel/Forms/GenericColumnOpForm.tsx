import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
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

export interface GenericCol {
  function_name: string;
  operands: { value: string | number; is_col: boolean }[];
  output_column_name: string;
}
interface GenericColDataConfig {
  computed_columns: GenericCol[];
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

const GenericColumnOpForm = ({
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
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    computed_columns: {
      function_name: string;
      operands: {
        type: string;
        col_val: string;
        const_val: number | undefined;
      }[];
      output_column_name: string;
    }[];
  };

  const { control, handleSubmit, reset, watch } = useForm<FormProps>({
    defaultValues: {
      computed_columns: [
        {
          function_name: '',
          operands: [{ type: 'col', col_val: '', const_val: undefined }],
          output_column_name: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'computed_columns.0.operands',
    rules: {
      minLength: { value: 1, message: 'Atleast one operand is required' },
    },
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(
          data
            .map((col: ColumnData) => col.name)
            .sort((a, b) => a.localeCompare(b))
        );
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
          computed_columns: data.computed_columns.map((item) => ({
            function_name: item.function_name,
            operands: item.operands.map(
              (op: {
                type: string;
                col_val: string;
                const_val: number | undefined;
              }) => ({
                is_col: op.type === 'col',
                value: op.type === 'col' ? op.col_val : op.const_val,
              })
            ),
            output_column_name: item.output_column_name,
          })),
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
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const { source_columns, computed_columns }: GenericColDataConfig =
        opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      reset({
        computed_columns: computed_columns.map((item: GenericCol) => ({
          function_name: item.function_name,
          operands: item.operands.map(
            (op: { value: any; is_col: boolean }) => ({
              type: op.is_col ? 'col' : 'val',
              col_val: op.is_col ? op.value : '',
              const_val: op.is_col ? undefined : op.value,
            })
          ),
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
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box>
          <Controller
            control={control}
            rules={{ required: 'Function name is required' }}
            name="computed_columns.0.function_name"
            render={({ field, fieldState }) => (
              <Input
                data-testid="function"
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label="Function*"
                sx={{ padding: '0' }}
                {...field}
              />
            )}
          />
          {fields.map((field, index) => {
            const radioValue = watch(
              `computed_columns.0.operands.${index}.type`
            );
            return (
              <Box key={field.id}>
                <Box sx={{ m: 2 }} />
                <Controller
                  name={`computed_columns.0.operands.${index}.type`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <RadioGroup
                        {...field}
                        defaultValue="col"
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '20px',
                        }}
                      >
                        <FormControlLabel
                          value="col"
                          control={<Radio />}
                          label="Column"
                          disabled={action === 'view'}
                        />
                        <FormControlLabel
                          value="val"
                          control={<Radio />}
                          label="Value"
                          disabled={action === 'view'}
                        />
                      </RadioGroup>
                    );
                  }}
                />
                <Box sx={{ m: 2 }} />
                {radioValue === 'col' ? (
                  <Controller
                    key={`operands.${index}.col_val`}
                    control={control}
                    rules={{ required: 'Column is required' }}
                    name={`computed_columns.0.operands.${index}.col_val`}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        {...field}
                        data-testid={`column${index}`}
                        helperText={fieldState.error?.message}
                        error={!!fieldState.error}
                        disabled={action === 'view'}
                        fieldStyle="transformation"
                        placeholder="Select column"
                        options={srcColumns}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    key={`operands.${index}.const_val`}
                    control={control}
                    rules={{ required: 'Value is required' }}
                    name={`computed_columns.0.operands.${index}.const_val`}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        helperText={fieldState.error?.message}
                        error={!!fieldState.error}
                        label=""
                        fieldStyle="transformation"
                        sx={{ padding: '0' }}
                        placeholder="Enter a numeric value"
                        type="number"
                        disabled={action === 'view'}
                      />
                    )}
                  />
                )}
                {index === fields.length - 1 ? (
                  <Button
                    disabled={action === 'view'}
                    variant="shadow"
                    type="button"
                    data-testid="addoperand"
                    sx={{
                      marginTop: '17px',
                    }}
                    onClick={(event) =>
                      append({
                        type: 'col',
                        col_val: '',
                        const_val: undefined,
                      })
                    }
                  >
                    + Add operand
                  </Button>
                ) : index < fields.length - 1 ? (
                  <Button
                    disabled={action === 'view'}
                    variant="outlined"
                    type="button"
                    data-testid="removeoperand"
                    sx={{ marginTop: '17px' }}
                    onClick={(event) => remove(index)}
                  >
                    Remove
                  </Button>
                ) : (
                  ''
                )}
              </Box>
            );
          })}
          <Controller
            control={control}
            rules={{ required: 'Output column name is required' }}
            name="computed_columns.0.output_column_name"
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

export default GenericColumnOpForm;

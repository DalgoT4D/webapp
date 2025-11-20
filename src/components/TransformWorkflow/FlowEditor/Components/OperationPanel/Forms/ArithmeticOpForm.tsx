import React, { useContext, useEffect, useState, useRef } from 'react';
import { OperationFormProps } from '../../OperationConfigLayout';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Box, Button, FormControlLabel, FormHelperText, Radio, RadioGroup } from '@mui/material';
import Input from '@/components/UI/Input/Input';
import InfoBox from '@/components/TransformWorkflow/FlowEditor/Components/InfoBox';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { useOpForm } from '@/customHooks/useOpForm';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  DbtModelResponse,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

interface ArithmeticDataConfig {
  operands: { value: string | number; is_col: boolean }[];
  operator: 'add' | 'sub' | 'mul' | 'div';
  source_columns: string[];
  output_column_name: string;
}

const ArithmeticOperations = [
  { id: 'add', label: 'Addition +' },
  { id: 'div', label: 'Division /' },
  { id: 'sub', label: 'Subtraction -' },
  { id: 'mul', label: 'Multiplication *' },
].sort((a, b) => a.label.localeCompare(b.label));

const ArithmeticOpForm = ({
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
  const skipEffectRef = useRef(false);

  type FormProps = {
    arithmeticOp: { id: string; label: string } | null;
    operands: {
      type: string;
      col_val: string;
      const_val: number | undefined;
    }[];
    output_column_name: string;
  };

  const { control, handleSubmit, reset, watch, formState } = useForm<FormProps>({
    defaultValues: {
      arithmeticOp: null,
      operands: [
        { type: 'col', col_val: '', const_val: 0 },
        { type: 'col', col_val: '', const_val: 0 },
      ],
      output_column_name: '',
    },
  });
  // Include this for multi-row input
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'operands',
    rules: {
      minLength: { value: 2, message: 'Atleast two operands are required' },
    },
  });

  const arithmeticOp = watch('arithmeticOp');

  useEffect(() => {
    if (skipEffectRef.current) {
      skipEffectRef.current = false;
      return;
    }
    replace([
      { type: 'col', col_val: '', const_val: 0 },
      { type: 'col', col_val: '', const_val: 0 },
    ]);
  }, [arithmeticOp, replace]);

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
        operator: data.arithmeticOp?.id,
        operands: data.operands.map(
          (op: { type: string; col_val: string; const_val: number | undefined }) => ({
            is_col: op.type === 'col',
            value: op.type === 'col' ? op.col_val : op.const_val,
          })
        ),
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
      const { operands, source_columns, operator, output_column_name }: ArithmeticDataConfig =
        operation_config.config;
      setSrcColumns(source_columns);

      // pre-fill form
      skipEffectRef.current = true;
      reset({
        arithmeticOp: ArithmeticOperations.find((op) => op.id === operator),
        output_column_name: output_column_name,
        operands: operands.map((op: { value: any; is_col: boolean }) => ({
          type: op.is_col ? 'col' : 'val',
          col_val: op.is_col ? op.value : '',
          const_val: op.is_col ? undefined : op.value,
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
        <Box>
          <Controller
            control={control}
            name="arithmeticOp"
            rules={{
              validate: (value) => (value && value?.id !== '') || 'Operation is required',
            }}
            render={({ field, fieldState }) => {
              return (
                <Autocomplete
                  data-testid="operation"
                  {...field}
                  disabled={action === 'view'}
                  placeholder="Select the operation*"
                  options={ArithmeticOperations}
                  isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
                  label="Operation*"
                  fieldStyle="transformation"
                  helperText={fieldState.error?.message}
                  error={!!fieldState.error}
                />
              );
            }}
          />
          {fields.map((field, index) => {
            const radioValue = watch(`operands.${index}.type`);
            return (
              <Box key={field.id}>
                <Box sx={{ m: 2 }} />
                <Controller
                  name={`operands.${index}.type`}
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
                    name={`operands.${index}.col_val`}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        data-testid={`column${index}`}
                        {...field}
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
                    name={`operands.${index}.const_val`}
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
                {arithmeticOp &&
                ((['sub', 'div'].includes(arithmeticOp?.id) && fields.length < 2) ||
                  ['add', 'mul'].includes(arithmeticOp?.id)) &&
                index === fields.length - 1 ? (
                  <Button
                    disabled={action === 'view'}
                    variant="shadow"
                    type="button"
                    data-testid="addoperand"
                    sx={{
                      marginTop: '17px',
                    }}
                    onClick={(event) => append({ type: 'col', col_val: '', const_val: undefined })}
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

          <Box sx={{ m: 2 }} />
          <Controller
            control={control}
            rules={{ required: 'Output column name is required' }}
            name="output_column_name"
            render={({ field, fieldState }) => (
              <Input
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label="Output Column Name*"
                sx={{ padding: '0' }}
                {...field}
              />
            )}
          />

          {formState.errors.operands && formState.errors.operands.root && (
            <FormHelperText sx={{ color: 'red' }}>
              {formState.errors.operands.root.message}
            </FormHelperText>
          )}

          <InfoBox text="Please select only numeric columns" />
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

export default ArithmeticOpForm;

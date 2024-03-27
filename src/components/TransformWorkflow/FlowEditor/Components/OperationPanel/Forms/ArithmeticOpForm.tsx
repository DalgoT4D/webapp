import React, { useContext, useEffect, useState } from 'react';
import { OperationFormProps } from '../../OperationConfigLayout';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel, OperationNodeData } from '../../Canvas';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import Input from '@/components/UI/Input/Input';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import InfoBox from '@/components/TransformWorkflow/FlowEditor/Components/InfoBox';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';

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
  clearAndClosePanel,
  dummyNodeId,
  action,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const globalContext = useContext(GlobalContext);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    arithmeticOp: { id: string; label: string };
    operands: {
      type: string;
      col_val: string;
      const_val: number | undefined;
    }[];
    output_column_name: string;
  };

  const { control, register, handleSubmit, reset, watch } = useForm<FormProps>({
    defaultValues: {
      arithmeticOp: { id: '', label: '' },
      operands: [{ type: 'col', col_val: '', const_val: 0 }],
      output_column_name: '',
    },
  });
  // Include this for multi-row input
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'operands',
  });

  const arithmeticOp = watch('arithmeticOp');

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
      if (!data.arithmeticOp.id) {
        errorToast('Please select an arithemtic operation', [], globalContext);
        return;
      }

      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: {
          operator: data.arithmeticOp.id,
          operands: data.operands.map(
            (op: {
              type: string;
              col_val: string;
              const_val: number | undefined;
            }) => ({
              is_col: op.type === 'col',
              value: op.type === 'col' ? op.col_val : op.const_val,
            })
          ),
          output_column_name: data.output_column_name,
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
        // need this input to be sent for the
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
      let {
        operands,
        source_columns,
        operator,
        output_column_name,
      }: ArithmeticDataConfig = opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      reset({
        arithmeticOp: ArithmeticOperations.find((op) => op.id === operator),
        output_column_name: output_column_name,
        operands: operands.map((op: { value: any; is_col: boolean }) => ({
          type: op.is_col ? 'col' : 'val',
          col_val: op.is_col ? op.value : '',
          const_val: op.is_col ? 0 : op.value,
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
        <Box sx={{}}>
          <Controller
            control={control}
            name="arithmeticOp"
            render={({ field }) => {
              return (
                <Autocomplete
                  disabled={action === 'view'}
                  placeholder="Select the operation"
                  options={ArithmeticOperations}
                  isOptionEqualToValue={(option: any, value: any) =>
                    option?.id === value?.id
                  }
                  label="Operation"
                  fieldStyle="transformation"
                  value={field.value}
                  onChange={(e, data: any) => {
                    if (data) field.onChange(data);
                    replace([{ type: 'col', col_val: '', const_val: 0 }]);
                  }}
                />
              );
            }}
          />
          {fields.map((field, index) => {
            const radioValue = watch(`operands.${index}.type`);
            return (
              <Box key={`field-${index}`}>
                <Box sx={{ m: 2 }} />
                <Controller
                  name={`operands.${index}.type`}
                  control={control}
                  render={({ field }) => {
                    console.log(field);
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
                    control={control}
                    name={`operands.${index}.col_val`}
                    render={({ field }) => (
                      <Autocomplete
                        disabled={action === 'view'}
                        fieldStyle="transformation"
                        placeholder="Select column"
                        options={srcColumns}
                        value={field.value}
                        onChange={(e, data) => {
                          field.onChange(data);
                        }}
                      />
                    )}
                  />
                ) : (
                  <Input
                    label=""
                    fieldStyle="transformation"
                    name={`operands.${index}.const_val`}
                    register={register}
                    sx={{ padding: '0' }}
                    placeholder="Enter the value"
                    type="number"
                    defaultValue="0"
                    disabled={action === 'view'}
                  />
                )}
                {((['sub', 'div'].includes(arithmeticOp?.id) &&
                  fields.length < 2) ||
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
                    onClick={(event) =>
                      append({ type: 'col', col_val: '', const_val: 0 })
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

          <Box sx={{ m: 2 }} />
          <Input
            disabled={action === 'view'}
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
          <InfoBox text="Please select only numeric columns" />
        </Box>
      </form>
    </Box>
  );
};

export default ArithmeticOpForm;

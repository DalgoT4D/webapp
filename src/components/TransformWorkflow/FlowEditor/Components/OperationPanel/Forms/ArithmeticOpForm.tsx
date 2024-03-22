import React, { useContext, useEffect, useState } from 'react';
import { OperationFormProps } from '../../OperationConfigLayout';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel, OperationNodeData } from '../../Canvas';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';
import {
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  SxProps,
  Typography,
} from '@mui/material';
import Input from '@/components/UI/Input/Input';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';

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

const ArithmeticOpForm = ({
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
      console.log('data', data);

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
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box sx={{}}>
          <Controller
            control={control}
            name="arithmeticOp"
            render={({ field }) => {
              return (
                <Autocomplete
                  options={[
                    { id: 'add', label: 'Addition +' },
                    { id: 'sub', label: 'Subtraction -' },
                    { id: 'mul', label: 'Multiplication *' },
                    { id: 'div', label: 'Division /' },
                  ]}
                  isOptionEqualToValue={(option: any, value: any) =>
                    option?.id === value?.id
                  }
                  value={field.value}
                  onChange={(e, data: any) => {
                    console.log(data);
                    if (data) field.onChange(data);
                    replace([{ type: 'col', col_val: '', const_val: 0 }]);
                  }}
                  renderInput={(params) => (
                    <Input
                      {...params}
                      sx={{ width: '100%' }}
                      label="Select the operation"
                      required
                    />
                  )}
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
                        />
                        <FormControlLabel
                          value="val"
                          control={<Radio />}
                          label="Value"
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
                        options={srcColumns}
                        value={field.value}
                        onChange={(e, data) => {
                          field.onChange(data);
                        }}
                        renderInput={(params) => (
                          <Input
                            {...params}
                            sx={{ width: '100%' }}
                            placeholder="Select column"
                          />
                        )}
                      />
                    )}
                  />
                ) : (
                  <Input
                    label=""
                    name={`operands.${index}.const_val`}
                    register={register}
                    sx={{ padding: '0' }}
                    placeholder="Enter the value"
                    type="number"
                    defaultValue="0"
                  />
                )}
                {((['sub', 'div'].includes(arithmeticOp?.id) &&
                  fields.length < 2) ||
                  ['add', 'mul'].includes(arithmeticOp?.id)) &&
                index === fields.length - 1 ? (
                  <Button
                    variant="outlined"
                    type="button"
                    data-testid="addoperand"
                    sx={{ marginTop: '17px' }}
                    onClick={(event) =>
                      append({ type: 'col', col_val: '', const_val: 0 })
                    }
                  >
                    Add operand
                  </Button>
                ) : index < fields.length - 1 ? (
                  <Button
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
            label="Output Column Name"
            sx={{ padding: '0' }}
            name="output_column_name"
            register={register}
            required
          />
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

export default ArithmeticOpForm;

import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
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

const ClauseOperands = ({
  clauseField,
  clauseIndex,
  control,
  watch,
  register,
  data,
}: {
  clauseField: any;
  clauseIndex: number;
  control: any;
  watch: (...args: any) => any;
  register: (...args: any) => any;
  data: {
    srcColumns: string[];
    advanceFilter: string;
    logicalOp: { id: string; label: string };
  };
}) => {
  const { fields: operandFields } = useFieldArray({
    control,
    name: `clauses.${clauseIndex}.operands`,
  });

  return (
    <>
      {operandFields
        .slice(0, data.logicalOp.id === 'between' ? 2 : 1)
        .map((operandField, operandIndex) => {
          const operandRadioValue = watch(
            `clauses.${clauseIndex}.operands.${operandIndex}.type`
          );

          return (
            <Box key={operandField.id}>
              <Controller
                name={`clauses.${clauseIndex}.operands.${operandIndex}.type`}
                control={control}
                rules={{ required: true }}
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
                        disabled={data.advanceFilter === 'yes'}
                      />
                      <FormControlLabel
                        value="val"
                        control={<Radio />}
                        label="Value"
                        disabled={data.advanceFilter === 'yes'}
                      />
                    </RadioGroup>
                  );
                }}
              />
              {operandRadioValue === 'col' ? (
                <Controller
                  control={control}
                  name={`clauses.${clauseIndex}.operands.${operandIndex}.col_val`}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      options={data.srcColumns}
                      disabled={data.advanceFilter === 'yes'}
                      value={field.value}
                      onChange={(e, data) => {
                        field.onChange(data);
                      }}
                      placeholder="Select column"
                      fieldStyle="transformation"
                    />
                  )}
                />
              ) : (
                <Input
                  label=""
                  fieldStyle="transformation"
                  name={`clauses.${clauseIndex}.operands.${operandIndex}.const_val`}
                  register={register}
                  sx={{ padding: '0' }}
                  placeholder="Enter the value"
                  disabled={data.advanceFilter === 'yes'}
                  required
                />
              )}
            </Box>
          );
        })}
    </>
  );
};

const CaseWhenOpForm = ({
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

  type clauseType = {
    filterCol: string;
    logicalOp: { id: string; label: string };
    operands: {
      type: string;
      col_val: string;
      const_val: string;
    }[];
    then: {
      type: string;
      col_val: string;
      const_val: string;
    };
  };

  type FormProps = {
    clauses: clauseType[];
    else: {
      type: string;
      col_val: string;
      const_val: string;
    };
    output_column_name: string;
    advanceFilter: string;
    sql_snippet: string;
  };

  const { control, register, handleSubmit, reset, watch } = useForm<FormProps>({
    defaultValues: {
      clauses: [
        {
          filterCol: '',
          logicalOp: { id: '', label: '' },
          operands: [
            { type: 'val', col_val: '', const_val: '' },
            { type: 'val', col_val: '', const_val: '' },
          ],
          then: {
            type: 'val',
            col_val: '',
            const_val: '',
          },
        },
      ],
      else: {
        type: 'val',
        col_val: '',
        const_val: '',
      },
      output_column_name: '',
      advanceFilter: 'no',
      sql_snippet: '',
    },
  });

  const {
    fields: clauseFields,
    append: appendClause,
    remove: removeClause,
  } = useFieldArray({
    control,
    name: 'clauses',
  });

  const advanceFilter = watch('advanceFilter');
  const elseRadioValue = watch('else.type');

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
      console.log('saving', data);
      if (data.advanceFilter === 'yes' && data.sql_snippet.length < 4) {
        errorToast('Please enter the SQL snippet', [], globalContext);
        return;
      }

      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: {
          case_type: data.advanceFilter === 'yes' ? 'advance' : 'simple',
          when_clauses: data.clauses.map((clause: clauseType) => {
            return {
              column: clause.filterCol,
              operands: clause.operands
                .map(
                  (op: {
                    type: string;
                    col_val: string;
                    const_val: string;
                  }) => ({
                    value: op.type === 'col' ? op.col_val : op.const_val,
                    is_col: op.type === 'col',
                  })
                )
                .slice(0, clause.logicalOp.id === 'between' ? 2 : 1),
              then: {
                value:
                  clause.then.type === 'col'
                    ? clause.then.col_val
                    : clause.then.const_val,
                is_col: clause.then.type === 'col',
              },
              operator: clause.logicalOp.id,
            };
          }),
          else_clause: {
            value:
              data.else.type === 'col'
                ? data.else.col_val
                : data.else.const_val,
            is_col: data.else.type === 'col',
          },
          sql_snippet: data.sql_snippet,
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
        <Box sx={{ padding: '0px 16px 0px 16px' }}>
          {clauseFields.map((clauseField, clauseIndex) => {
            const thenRadioValue = watch(`clauses.${clauseIndex}.then.type`);
            const logicalOpVal = watch(`clauses.${clauseIndex}.logicalOp`);

            return (
              <Box key={clauseField.id}>
                <Box sx={{ paddingTop: '16px' }}>
                  <Typography fontWeight="600" color="#888888">
                    CASE {(clauseIndex + 1).toString().padStart(2, '0')}
                  </Typography>
                </Box>
                <Controller
                  control={control}
                  name={`clauses.${clauseIndex}.filterCol`}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      options={srcColumns}
                      disabled={advanceFilter === 'yes'}
                      //   value={field.value}
                      onChange={(e, data) => {
                        field.onChange(data);
                      }}
                      label="When"
                      placeholder="Select column to condition on"
                      fieldStyle="transformation"
                    />
                  )}
                />
                <Box sx={{ m: 2 }} />
                <Controller
                  control={control}
                  name={`clauses.${clauseIndex}.logicalOp`}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      options={[
                        {
                          id: '=',
                          label: 'Equal To =',
                        },
                        {
                          id: '!=',
                          label: 'Not Equal To !=',
                        },
                        {
                          id: '>=',
                          label: 'Greater Than or Equal To >=',
                        },
                        {
                          id: '>',
                          label: 'Greater Than >',
                        },
                        {
                          id: '<',
                          label: 'Less Than <',
                        },
                        {
                          id: '<=',
                          label: 'Less Than or Equal To <=',
                        },
                        {
                          id: 'between',
                          label: 'Between',
                        },
                      ]}
                      isOptionEqualToValue={(option: any, value: any) =>
                        option?.id === value?.id
                      }
                      disabled={advanceFilter === 'yes'}
                      value={field.value}
                      onChange={(e, data) => {
                        if (data) field.onChange(data);
                      }}
                      placeholder="Select operation"
                      fieldStyle="transformation"
                    />
                  )}
                />
                <Box sx={{ m: 2 }} />
                <ClauseOperands
                  watch={watch}
                  register={register}
                  control={control}
                  clauseField={clauseField}
                  clauseIndex={clauseIndex}
                  data={{ srcColumns, advanceFilter, logicalOp: logicalOpVal }}
                />
                <Box sx={{ m: 2 }} />
                <Box>
                  <Controller
                    name={`clauses.${clauseIndex}.then.type`}
                    control={control}
                    render={({ field }) => {
                      return (
                        <Box>
                          <FormLabel component="legend">Then</FormLabel>
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
                              disabled={advanceFilter === 'yes'}
                            />
                            <FormControlLabel
                              value="val"
                              control={<Radio />}
                              label="Value"
                              disabled={advanceFilter === 'yes'}
                            />
                          </RadioGroup>
                        </Box>
                      );
                    }}
                  />
                  {thenRadioValue === 'col' ? (
                    <Controller
                      control={control}
                      name={`clauses.${clauseIndex}.then.col_val`}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Autocomplete
                          options={srcColumns}
                          disabled={advanceFilter === 'yes'}
                          value={field.value}
                          onChange={(e, data) => {
                            field.onChange(data);
                          }}
                          placeholder="Select column"
                          fieldStyle="transformation"
                        />
                      )}
                    />
                  ) : (
                    <Input
                      label=""
                      fieldStyle="transformation"
                      name={`clauses.${clauseIndex}.then.const_val`}
                      register={register}
                      sx={{ padding: '0' }}
                      placeholder="Enter the value"
                      disabled={advanceFilter === 'yes'}
                      required
                    />
                  )}
                </Box>
                <Box sx={{ m: 2 }} />
                {clauseIndex === clauseFields.length - 1 ? (
                  <Button
                    variant="outlined"
                    type="button"
                    data-testid="addcase"
                    sx={{}}
                    disabled={advanceFilter === 'yes'}
                    onClick={(event) =>
                      appendClause({
                        filterCol: '',
                        logicalOp: { id: '', label: '' },
                        operands: [{ type: 'val', col_val: '', const_val: '' }],
                        then: {
                          type: 'val',
                          col_val: '',
                          const_val: '',
                        },
                      })
                    }
                  >
                    Add case
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    type="button"
                    data-testid="removecase"
                    sx={{}}
                    disabled={advanceFilter === 'yes'}
                    onClick={(event) => removeClause(clauseIndex)}
                  >
                    Remove case
                  </Button>
                )}
              </Box>
            );
          })}
          <Box sx={{ m: 2 }} />
          <Box>
            <Controller
              name={`else.type`}
              control={control}
              render={({ field }) => {
                return (
                  <Box>
                    <FormLabel component="legend">Else</FormLabel>
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
                        disabled={advanceFilter === 'yes'}
                      />
                      <FormControlLabel
                        value="val"
                        control={<Radio />}
                        label="Value"
                        disabled={advanceFilter === 'yes'}
                      />
                    </RadioGroup>
                  </Box>
                );
              }}
            />
            {elseRadioValue === 'col' ? (
              <Controller
                control={control}
                name={`else.col_val`}
                render={({ field }) => (
                  <Autocomplete
                    options={srcColumns}
                    disabled={advanceFilter === 'yes'}
                    value={field.value}
                    onChange={(e, data) => {
                      field.onChange(data);
                    }}
                    placeholder="Select column"
                    fieldStyle="transformation"
                  />
                )}
              />
            ) : (
              <Input
                fieldStyle="transformation"
                label=""
                name={`else.const_val`}
                register={register}
                sx={{ padding: '0' }}
                placeholder="Enter the value"
                disabled={advanceFilter === 'yes'}
              />
            )}
          </Box>
          <Box sx={{ m: 2 }} />
          <Input
            fieldStyle="transformation"
            label="Output Column Name"
            name={`output_column_name`}
            placeholder="Enter column name"
            register={register}
            required
          />
          <Box sx={{ m: 2 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography fontWeight={600} fontSize="14px" color="#5E5E5E">
              Advance Filter
            </Typography>
            <Controller
              name="advanceFilter"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Stack direction={'row'} alignItems="center" gap={'10%'}>
                  <Switch
                    checked={value === 'yes'}
                    value={value}
                    onChange={(event, value) => {
                      onChange(value ? 'yes' : 'no');
                    }}
                  />
                </Stack>
              )}
            />
          </Box>
          {advanceFilter === 'yes' && (
            <Input
              fieldStyle="transformation"
              label=""
              name="sql_snippet"
              register={register}
              sx={{ padding: '0' }}
              placeholder="Enter the value"
              type="text"
              multiline
              rows={4}
            />
          )}

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

export default CaseWhenOpForm;

import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import { parseStringForNull } from '@/utils/common';

interface GenericOperand {
  value: string;
  is_col: boolean;
}

interface WhenClause {
  column: string;
  operands: GenericOperand[];
  operator: string;
  then: GenericOperand;
}

interface CasewheneDataConfig {
  case_type: 'simple' | 'advance';
  else_clause: GenericOperand;
  when_clauses: WhenClause[];
  sql_snippet: string;
  output_column_name: string;
  source_columns: string[];
  other_inputs: any[];
}

export const LogicalOperators = [
  {
    id: 'between',
    label: 'Between',
  },
  {
    id: '=',
    label: 'Equal To =',
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
    id: '!=',
    label: 'Not Equal To !=',
  },
].sort((a, b) => a.label.localeCompare(b.label));

const ClauseOperands = ({
  clauseField,
  clauseIndex,
  control,
  watch,

  data,
  disableFields,
}: {
  clauseField: any;
  clauseIndex: number;
  control: any;
  watch: (...args: any) => any;
  disableFields: boolean;
  data: {
    srcColumns: string[];
    advanceFilter: string;
    logicalOp: { id: string; label: string } | null;
  };
}) => {
  const { fields: operandFields } = useFieldArray({
    control,
    name: `clauses.${clauseIndex}.operands`,
  });

  return (
    <>
      {operandFields
        .slice(0, data.logicalOp?.id === 'between' ? 2 : 1)
        .map((operandField, operandIndex) => {
          const operandRadioValue = watch(
            `clauses.${clauseIndex}.operands.${operandIndex}.type`
          );

          return (
            <Box key={operandField.id}>
              <Controller
                name={`clauses.${clauseIndex}.operands.${operandIndex}.type`}
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
                        disabled={disableFields}
                        required={data.advanceFilter === 'no'}
                      />
                      <FormControlLabel
                        value="val"
                        control={<Radio />}
                        label="Value"
                        disabled={disableFields}
                        required={data.advanceFilter === 'no'}
                      />
                    </RadioGroup>
                  );
                }}
              />
              {operandRadioValue === 'col' ? (
                <Controller
                  key={`clauses.${clauseIndex}.operands.${operandIndex}.col_val`}
                  control={control}
                  name={`clauses.${clauseIndex}.operands.${operandIndex}.col_val`}
                  rules={{
                    required:
                      data.advanceFilter === 'no' && 'Column is required',
                  }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      {...field}
                      helperText={fieldState.error?.message}
                      error={!!fieldState.error}
                      options={data.srcColumns.sort((a, b) =>
                        a.localeCompare(b)
                      )}
                      disabled={disableFields}
                      placeholder="Select column"
                      fieldStyle="transformation"
                    />
                  )}
                />
              ) : (
                <Controller
                  control={control}
                  key={`clauses.${clauseIndex}.operands.${operandIndex}.const_val`}
                  name={`clauses.${clauseIndex}.operands.${operandIndex}.const_val`}
                  render={({ field, fieldState }) => (
                    <Input
                      data-testid={`value${operandIndex}`}
                      helperText={fieldState.error?.message}
                      error={!!fieldState.error}
                      fieldStyle="transformation"
                      sx={{ padding: '0' }}
                      placeholder="Enter the value"
                      disabled={disableFields}
                      {...field}
                    />
                  )}
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
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited

  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type clauseType = {
    filterCol: string;
    logicalOp: { id: string; label: string } | null;
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

  const { control, handleSubmit, reset, watch } = useForm<FormProps>({
    defaultValues: {
      clauses: [
        {
          filterCol: '',
          logicalOp: null,
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
      setSrcColumns(
        nodeData.output_cols.sort((a: string, b: string) => a.localeCompare(b))
      );
    }
  };

  const handleSave = async (data: FormProps) => {
    try {
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
                    value:
                      op.type === 'col'
                        ? op.col_val
                        : parseStringForNull(op.const_val),
                    is_col: op.type === 'col',
                  })
                )
                .slice(0, clause.logicalOp?.id === 'between' ? 2 : 1),
              then: {
                value:
                  clause.then.type === 'col'
                    ? clause.then.col_val
                    : parseStringForNull(clause.then.const_val),
                is_col: clause.then.type === 'col',
              },
              operator: clause.logicalOp?.id,
            };
          }),
          else_clause: {
            value:
              data.else.type === 'col'
                ? data.else.col_val
                : parseStringForNull(data.else.const_val),
            is_col: data.else.type === 'col',
          },
          sql_snippet: data.sql_snippet,
          output_column_name: data.output_column_name,
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      // api call
      setLoading(true);
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
    } catch (error) {
      console.log(error);
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
      const {
        source_columns,
        when_clauses,
        else_clause,
        sql_snippet,
        case_type,
        output_column_name,
      }: CasewheneDataConfig = opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      const clauses = when_clauses.map((clause: WhenClause) => ({
        filterCol: clause.column,
        logicalOp: LogicalOperators.find((op) => op.id === clause.operator) || {
          id: '',
          label: '',
        },
        operands: clause.operands.map((op: GenericOperand) => ({
          type: op.is_col ? 'col' : 'val',
          col_val: op.is_col ? op.value : '',
          const_val: !op.is_col ? op.value : '',
        })),
        then: {
          type: clause.then.is_col ? 'col' : 'val',
          col_val: clause.then.is_col ? clause.then.value : '',
          const_val: !clause.then.is_col ? clause.then.value : '',
        },
      }));
      reset({
        clauses: clauses,
        else: {
          type: else_clause.is_col ? 'col' : 'val',
          col_val: else_clause.value,
          const_val: else_clause.value,
        },
        output_column_name: output_column_name,
        advanceFilter: case_type === 'advance' ? 'yes' : 'no',
        sql_snippet: sql_snippet,
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

  const isDisabled = advanceFilter === 'yes' || action === 'view';

  const isAdvanceFieldsDisabled = action === 'view';

  return (
    <Box sx={{ ...sx }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box sx={{ padding: '0px 16px 0px 16px' }}>
          {clauseFields.map((clauseField, clauseIndex) => {
            const thenRadioValue = watch(`clauses.${clauseIndex}.then.type`);
            const logicalOpVal = watch(`clauses.${clauseIndex}.logicalOp`);
            const isZerothIndex = clauseIndex === 0;

            return (
              <Box key={clauseField.id}>
                <Box
                  sx={
                    !isZerothIndex
                      ? {
                          borderBottom: '1px solid #DDDDDD',
                          pb: 2,
                        }
                      : undefined
                  }
                >
                  <Box sx={{ paddingTop: '16px' }}>
                    <Typography fontWeight="600" color="#888888">
                      CASE {(clauseIndex + 1).toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mr: '10px',
                      mt: '10px',
                      mb: '10px',
                    }}
                  >
                    When&nbsp;
                    <InfoTooltip
                      title={
                        'The first case- select the relevant column, operation, and comparison column or value.'
                      }
                    />
                  </Box>
                  <Controller
                    key={`clauses.${clauseIndex}.filterCol`}
                    control={control}
                    rules={{
                      required: advanceFilter === 'no' && 'Column is required',
                    }}
                    name={`clauses.${clauseIndex}.filterCol`}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        {...field}
                        data-testid="column"
                        helperText={fieldState.error?.message}
                        error={!!fieldState.error}
                        options={srcColumns}
                        disabled={isDisabled}
                        placeholder="Select column to condition on"
                        fieldStyle="transformation"
                      />
                    )}
                  />
                  <Box sx={{ m: 2 }} />
                  <Controller
                    key={`clauses.${clauseIndex}.logicalOp`}
                    control={control}
                    rules={{
                      validate: (value) =>
                        advanceFilter !== 'no' ||
                        value !== null ||
                        'Operation is required',
                    }}
                    name={`clauses.${clauseIndex}.logicalOp`}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        {...field}
                        data-testid="operation"
                        helperText={fieldState.error?.message}
                        error={!!fieldState.error}
                        options={LogicalOperators}
                        isOptionEqualToValue={(option: any, value: any) =>
                          option?.id === value?.id
                        }
                        disabled={isDisabled}
                        placeholder="Select operation*"
                        fieldStyle="transformation"
                      />
                    )}
                  />
                  <Box sx={{ m: 2 }} />
                  <ClauseOperands
                    watch={watch}
                    control={control}
                    clauseField={clauseField}
                    clauseIndex={clauseIndex}
                    disableFields={isDisabled}
                    data={{
                      srcColumns,
                      advanceFilter,
                      logicalOp: logicalOpVal,
                    }}
                  />
                  <Box sx={{ m: 2 }} />
                  <Box>
                    <Controller
                      name={`clauses.${clauseIndex}.then.type`}
                      control={control}
                      rules={{ required: advanceFilter === 'no' }}
                      render={({ field }) => {
                        return (
                          <Box sx={{ alignItems: 'center' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mr: '10px',
                              }}
                            >
                              Then&nbsp;
                              <InfoTooltip
                                title={
                                  'The output when the case criterion is fullfilled'
                                }
                              />
                            </Box>
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
                                disabled={isDisabled}
                              />
                              <FormControlLabel
                                value="val"
                                control={<Radio />}
                                label="Value"
                                disabled={isDisabled}
                              />
                            </RadioGroup>
                          </Box>
                        );
                      }}
                    />
                    {thenRadioValue === 'col' ? (
                      <Controller
                        control={control}
                        key={`clauses.${clauseIndex}.then.col_val`}
                        name={`clauses.${clauseIndex}.then.col_val`}
                        rules={{
                          required:
                            advanceFilter === 'no' && 'Column is required',
                        }}
                        render={({ field, fieldState }) => (
                          <Autocomplete
                            {...field}
                            helperText={fieldState.error?.message}
                            error={!!fieldState.error}
                            options={srcColumns}
                            disabled={isDisabled}
                            value={field.value}
                            placeholder="Select column"
                            fieldStyle="transformation"
                          />
                        )}
                      />
                    ) : (
                      <Controller
                        control={control}
                        key={`clauses.${clauseIndex}.then.const_val`}
                        name={`clauses.${clauseIndex}.then.const_val`}
                        render={({ field, fieldState }) => (
                          <Input
                            {...field}
                            label=""
                            data-testid="thenInput"
                            fieldStyle="transformation"
                            helperText={fieldState.error?.message}
                            error={!!fieldState.error}
                            sx={{ padding: '0' }}
                            placeholder="Enter the value"
                            disabled={isDisabled}
                          />
                        )}
                      />
                    )}
                  </Box>
                  <Box sx={{ m: 2 }} />
                  {clauseFields.length > 1 && (
                    <Button
                      variant="shadow"
                      color="error"
                      type="button"
                      data-testid="removecase"
                      sx={{}}
                      disabled={isDisabled}
                      onClick={(event) => removeClause(clauseIndex)}
                    >
                      Remove case {clauseIndex + 1}
                    </Button>
                  )}
                </Box>

                {clauseIndex === clauseFields.length - 1 ? (
                  <Button
                    variant="shadow"
                    type="button"
                    data-testid="addcase"
                    sx={{ mt: 2 }}
                    disabled={isDisabled}
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
                    + Add case {clauseIndex + 2}
                  </Button>
                ) : null}
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
                  <Box sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mr: '10px',
                      }}
                    >
                      Else&nbsp;
                      <InfoTooltip
                        title={
                          'The output if none of the case statements entered above are fulfilled'
                        }
                      />
                    </Box>
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
                        disabled={isDisabled}
                      />
                      <FormControlLabel
                        value="val"
                        control={<Radio />}
                        label="Value"
                        disabled={isDisabled}
                      />
                    </RadioGroup>
                  </Box>
                );
              }}
            />
            {elseRadioValue === 'col' ? (
              <Controller
                key={`else.col_val`}
                control={control}
                name={`else.col_val`}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={srcColumns}
                    disabled={isDisabled}
                    placeholder="Select column"
                    fieldStyle="transformation"
                  />
                )}
              />
            ) : (
              <Controller
                key={`else.const_val`}
                control={control}
                name={`else.const_val`}
                render={({ field }) => (
                  <Input
                    fieldStyle="transformation"
                    label=""
                    {...field}
                    sx={{ padding: '0' }}
                    placeholder="Enter the value"
                    disabled={isDisabled}
                  />
                )}
              />
            )}
          </Box>
          <Box sx={{ m: 2 }} />
          <Controller
            rules={{ required: 'Column name is required' }}
            control={control}
            name={`output_column_name`}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label="Output Column Name*"
                placeholder="Enter column name"
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Typography fontWeight={600} fontSize="14px" color="#5E5E5E">
                Advance Filter
              </Typography>
              <InfoTooltip
                title={
                  'Want to try something more complicated? Enter the SQL statement.'
                }
              ></InfoTooltip>
            </Box>
            <Controller
              name="advanceFilter"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Stack direction={'row'} alignItems="center" gap={'10%'}>
                  <Switch
                    disabled={action === 'view'}
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
            <Controller
              control={control}
              name="sql_snippet"
              rules={{
                required: 'Value is required',
              }}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  helperText={fieldState.error?.message}
                  error={!!fieldState.error}
                  fieldStyle="transformation"
                  label=""
                  sx={{ padding: '0' }}
                  placeholder="Enter the value"
                  type="text"
                  multiline
                  rows={4}
                  disabled={isAdvanceFieldsDisabled}
                />
              )}
            />
          )}

          <Box sx={{ m: 2 }} />
          <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
            <Button
              disabled={isAdvanceFieldsDisabled}
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

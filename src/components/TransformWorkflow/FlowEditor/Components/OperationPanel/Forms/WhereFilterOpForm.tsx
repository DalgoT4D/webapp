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
import { Controller, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import { LogicalOperators } from './CaseWhenOpForm';
import { parseStringForNull } from '@/utils/common';

interface GenericOperand {
  value: string;
  is_col: boolean;
}

interface WhereClause {
  column: string;
  operand: GenericOperand;
  operator: string;
}

interface WherefilterDataConfig {
  where_type: 'and' | 'or' | 'sql';
  clauses: WhereClause[];
  sql_snippet: string;
  source_columns: string[];
  other_inputs: any[];
}

const WhereFilterOpForm = ({
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

  type FormProps = {
    filterCol: string;
    logicalOp: { id: string; label: string };
    operand: {
      type: string;
      col_val: string;
      const_val: string;
    };
    advanceFilter: string;
    sql_snippet: string;
  };

  const { control, handleSubmit, reset, watch } = useForm<FormProps>({
    defaultValues: {
      filterCol: '',
      logicalOp: { id: '', label: '' },
      operand: { type: 'col', col_val: '', const_val: '' },
      advanceFilter: 'no',
      sql_snippet: '',
    },
  });

  const radioValue = watch('operand.type');
  const advanceFilter = watch('advanceFilter');

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
        other_inputs: [],
        config: {
          where_type: data.advanceFilter === 'yes' ? 'sql' : 'and',
          clauses: [
            {
              column: data.filterCol,
              operator: data.logicalOp.id,
              operand: {
                value:
                  data.operand.type === 'col'
                    ? data.operand.col_val
                    : parseStringForNull(data.operand.const_val),
                is_col: data.operand.type === 'col',
              },
            },
          ],
          sql_snippet: data.sql_snippet,
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
        clauses,
        sql_snippet,
        where_type,
      }: WherefilterDataConfig = opConfig;
      setSrcColumns(source_columns);

      let clauseFields = {};
      if (clauses.length === 1) {
        const { column, operator, operand } = clauses[0];

        clauseFields = {
          filterCol: column,
          logicalOp: LogicalOperators.find((op) => op.id === operator),
          operand: operand
            ? {
              type: operand.is_col ? 'col' : 'val',
              col_val: operand.is_col ? operand.value : '',
              const_val: !operand.is_col ? operand.value : '',
            }
            : { type: 'col', col_val: '', const_val: '' },
        };
      }

      // pre-fill form
      reset({
        ...clauseFields,
        advanceFilter: where_type === 'sql' ? 'yes' : 'no',
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

  const isNonAdancedFieldsDisabled =
    advanceFilter === 'yes' || action === 'view';

  const isAdvanceFieldsDisabled = action === 'view';

  return (
    <Box sx={{ ...sx }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box sx={{ padding: '32px 16px 0px 16px' }}>
          <Box>
            <Controller
              control={control}
              key="filterCol"
              name="filterCol"
              rules={{
                required: advanceFilter === 'no' && 'Column is required',
              }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  data-testid="columnToCheck"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  options={srcColumns}
                  fieldStyle="transformation"
                  disabled={isNonAdancedFieldsDisabled}
                  label="Select column*"
                />
              )}
            />
            <Box sx={{ m: 2 }} />
            <Controller
              control={control}
              name="logicalOp"
              rules={{
                validate: (value) =>
                  advanceFilter !== 'no' ||
                  value.id !== '' ||
                  'Operation is required',
              }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  data-testid="operation"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  options={LogicalOperators.filter((op) => op.id !== 'between')}
                  isOptionEqualToValue={(option: any, value: any) =>
                    option?.id === value?.id
                  }
                  disabled={isNonAdancedFieldsDisabled}
                  label="Select operation*"
                  fieldStyle="transformation"
                />
              )}
            />
            <Box sx={{ m: 2 }} />
            <Controller
              name={`operand.type`}
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
                      disabled={isNonAdancedFieldsDisabled}
                    />
                    <FormControlLabel
                      value="val"
                      control={<Radio />}
                      label="Value"
                      disabled={isNonAdancedFieldsDisabled}
                    />
                  </RadioGroup>
                );
              }}
            />
            {radioValue === 'col' ? (
              <Controller
                control={control}
                rules={{
                  required: advanceFilter === 'no' && 'Column is required',
                }}
                key="operand.col_val"
                name="operand.col_val"
                render={({ field, fieldState }) => (
                  <Autocomplete
                    {...field}
                    data-testid="checkAgainstColumn"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fieldStyle="transformation"
                    options={srcColumns}
                    disabled={isNonAdancedFieldsDisabled}
                    placeholder="Select column*"
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                key="operand.const_val"
                name="operand.const_val"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fieldStyle="transformation"
                    label=""
                    sx={{ padding: '0' }}
                    placeholder="Enter the value"
                    disabled={isNonAdancedFieldsDisabled}
                  />
                )}
              />
            )}
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
                      disabled={isAdvanceFieldsDisabled}
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
            <Box sx={{ m: 2 }} />
            {advanceFilter === 'yes' && (
              <Controller
                control={control}
                name="sql_snippet"
                rules={{
                  required: 'Value is required',
                }}
                render={({ field, fieldState }) => (
                  <Input
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fieldStyle="transformation"
                    label=""
                    {...field}
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
          </Box>

          <Box sx={{ m: 2 }} />
          <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
            <Button
              variant="contained"
              type="submit"
              data-testid="savebutton"
              fullWidth
              sx={{ marginTop: '17px' }}
              disabled={isAdvanceFieldsDisabled}
            >
              Save
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default WhereFilterOpForm;

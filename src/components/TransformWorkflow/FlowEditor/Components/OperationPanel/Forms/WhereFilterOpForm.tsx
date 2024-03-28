import React, { useContext, useEffect, useState } from 'react';
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
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';

const WhereFilterOpForm = ({
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

  const { control, register, handleSubmit, reset, watch } = useForm<FormProps>({
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
      if (data.advanceFilter === 'yes' && data.sql_snippet.length < 4) {
        errorToast('Please enter the SQL snippet', [], globalContext);
        return;
      }

      if (data.advanceFilter === 'no') {
        if (!data.filterCol) {
          errorToast(
            'Please select the column to filter on',
            [],
            globalContext
          );
          return;
        }

        if (!data.logicalOp.id) {
          errorToast('Please select the operation', [], globalContext);
          return;
        }

        if (!data.operand.col_val && !data.operand.const_val) {
          errorToast(
            'Please select either a column or a value',
            [],
            globalContext
          );
          return;
        }
      }

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
                    : data.operand.const_val,
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
        <Box sx={{ padding: '32px 16px 0px 16px' }}>
          <Box>
            <Controller
              control={control}
              name={`filterCol`}
              render={({ field }) => (
                <Autocomplete
                  options={srcColumns}
                  fieldStyle="transformation"
                  disabled={advanceFilter === 'yes'}
                  //   value={field.value}
                  onChange={(e, data) => {
                    field.onChange(data);
                  }}
                  label="Select column"
                />
              )}
            />
            <Box sx={{ m: 2 }} />
            <Controller
              control={control}
              name="logicalOp"
              render={({ field }) => (
                <Autocomplete
                  options={[
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
                  ]}
                  isOptionEqualToValue={(option: any, value: any) =>
                    option?.id === value?.id
                  }
                  disabled={advanceFilter === 'yes'}
                  value={field.value}
                  onChange={(e, data) => {
                    if (data) field.onChange(data);
                  }}
                  label="Select operation"
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
                      disabled={advanceFilter === 'yes'}
                    />
                    <FormControlLabel
                      value="val"
                      control={<Radio />}
                      label="Value"
                      disabled={advanceFilter === 'yes'}
                    />
                  </RadioGroup>
                );
              }}
            />
            {radioValue === 'col' ? (
              <Controller
                control={control}
                name="operand.col_val"
                render={({ field }) => (
                  <Autocomplete
                    fieldStyle="transformation"
                    options={srcColumns}
                    disabled={advanceFilter === 'yes'}
                    value={field.value}
                    onChange={(e, data) => {
                      field.onChange(data);
                    }}
                    placeholder="Select column"
                  />
                )}
              />
            ) : (
              <Input
                fieldStyle="transformation"
                label=""
                name="operand.const_val"
                register={register}
                sx={{ padding: '0' }}
                placeholder="Enter the value"
                disabled={advanceFilter === 'yes'}
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
          </Box>

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

export default WhereFilterOpForm;

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Typography,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { httpGet, httpPost, httpPut } from '@/helpers/http';

import { OperationFormProps } from '../../OperationConfigLayout';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import {
  CanvasNodeDataResponse,
  CanvasNodeTypeEnum,
  CreateOperationNodePayload,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

interface DropDataConfig {
  columns: string[];
  source_columns: string[];
  other_inputs: any[];
}

const DropColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [valid, setValid] = useState(true);
  const [search, setSearch] = useState('');
  const theme = useTheme();

  type FormColumnData = {
    col_name: string;
    drop_col: boolean;
  };

  type FormData = {
    config: FormColumnData[];
  };

  const { control, handleSubmit, getValues, setValue, reset } = useForm<FormData>({
    defaultValues: {
      config: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'config',
  });

  const { config } = getValues();

  const findColumnIndex = (columnName: string) => {
    const index = config?.findIndex((column) => column.col_name == columnName);
    return index == -1 ? 0 : index;
  };

  const fetchAndSetSourceColumns = async () => {
    if (node) {
      setSrcColumns(node.data.output_columns);
      setValue(
        'config',
        node.data.output_columns.map((col: string) => ({
          col_name: col,
          drop_col: false,
        }))
      );
    }
  };

  const handleSave = async (formData: FormData) => {
    const selectedColumns = formData.config
      .filter((column) => column.drop_col)
      .map((column) => column.col_name);

    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      if (selectedColumns.length < 1) {
        setValid(false);
        return;
      }

      const opConfig: any = { columns: selectedColumns };

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        const postData: CreateOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          other_inputs: [],
          config: opConfig,
          input_node_uuid: finalNode?.id || '',
        };
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          postData
        );
      } else if (finalAction === 'edit') {
        const postData: EditOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          other_inputs: [],
          config: opConfig,
        };

        operationNode = await httpPut(
          session,
          `transform/v2/dbt_project/operations/nodes/${finalNode?.id}/`,
          postData
        );
      }
      continueOperationChain(operationNode);
    } catch (error) {
      console.log(error);
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
      const { source_columns, columns }: DropDataConfig = operation_config.config;
      setSrcColumns(source_columns);

      // pre-fill form
      const dropCols = source_columns.map((col) => ({
        col_name: col,
        drop_col: columns.includes(col),
      }));
      reset({ config: dropCols });
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

  const filteredFields = useMemo(() => {
    return fields.filter((field) => field.col_name.toLowerCase().includes(search.toLowerCase()));
  }, [fields, search]);

  const handleSelectAll = () => {
    filteredFields.forEach((field, index) => {
      setValue(`config.${findColumnIndex(field.col_name)}.drop_col`, true);
    });
  };

  const handleClear = () => {
    filteredFields.forEach((field, index) => {
      setValue(`config.${findColumnIndex(field.col_name)}.drop_col`, false);
    });
  };

  return (
    <Box sx={{ ...sx, marginTop: '17px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', padding: '0px 12px' }}>
        <Input
          fieldStyle="transformation"
          sx={{ px: 1, pb: 1, width: '100%' }}
          placeholder="Search Here"
          onChange={(e) => setSearch(e.target.value)}
          data-testid="searchDropColBar"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box
        sx={{
          padding: '0px 12px',
          borderRight: '1px solid #E8E8E8',
          background: '#EEF3F3',
        }}
      >
        <Typography
          sx={{
            fontWeight: '600',
            padding: '12px 16px',
            fontSize: '14px',
          }}
        >
          Column Name
        </Typography>
      </Box>
      <form onSubmit={handleSubmit(handleSave)}>
        {!valid && (
          <FormHelperText sx={{ color: 'red', ml: 3 }}>
            Please select atleast 1 column
          </FormHelperText>
        )}
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 12px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Box
                sx={{ ':hover': { cursor: 'pointer' } }}
                onClick={handleSelectAll}
                data-testid="selectAllDropColClick"
              >
                <Typography fontWeight={600} fontSize={'14px'}>
                  SELECT ALL
                </Typography>
              </Box>
              <Box
                sx={{ ':hover': { cursor: 'pointer' } }}
                onClick={handleClear}
                data-testid="clearAllDropColClick"
              >
                <Typography fontWeight={600} fontSize={'14px'}>
                  CLEAR
                </Typography>
              </Box>
            </Box>
            <Box>
              <Divider
                sx={{ border: '1px solid #00000014', marginTop: '8px' }}
                orientation="horizontal"
              />
            </Box>
          </Box>
          <Box>
            {filteredFields.map(
              (column: { col_name: string; drop_col: boolean }, index: number) => {
                const colIndex = findColumnIndex(column.col_name);
                return [
                  <Controller
                    name={`config.${colIndex}.drop_col`}
                    key={`${node?.id}config.${colIndex}.key`}
                    control={control}
                    render={({ field }) => (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1px',
                          background: field.value ? '#F5FAFA' : '',
                          padding: '0px 12px',
                        }}
                      >
                        <FormControlLabel
                          key={`${node?.id}${colIndex}.form`}
                          control={
                            <Checkbox
                              {...field}
                              data-testid={`checkBoxInputContainer${colIndex}`}
                              checked={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                              }}
                              sx={{
                                transform: 'scale(0.8)',
                              }}
                              key={`${node?.id}chekboxInput`}
                            />
                          }
                          label={column.col_name}
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              fontSize: theme.typography.pxToRem(14),
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                            },
                          }}
                        />
                      </Box>
                    )}
                  />,
                ];
              }
            )}
          </Box>
        </Box>
        {!valid && (
          <FormHelperText sx={{ color: 'red', ml: 3 }}>
            Please select atleast 1 column
          </FormHelperText>
        )}

        <Box sx={{ m: 2 }} />
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', p: 2 }}>
          <Button
            variant="contained"
            type="submit"
            data-testid="savebutton"
            fullWidth
            disabled={action === 'view'}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default DropColumnOp;

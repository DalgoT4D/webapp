import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
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
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';

import { OperationFormProps } from '../../OperationConfigLayout';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';

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
  // const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [search, setSearch] = useState('');
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
        ? (node?.data as OperationNodeData)
        : {};
  const theme = useTheme();

  type FormColumnData = {
    col_name: string;
    drop_col: boolean;
  };

  type FormData = {
    config: FormColumnData[];
  };

  const { control, handleSubmit, getValues, setValue } = useForm<FormData>({
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
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
        setValue(
          'config',
          data.map((col: ColumnData) => ({
            col_name: col.name,
            drop_col: false,
          }))
        );
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setValue(
        'config',
        nodeData.output_cols.map((col: string) => ({
          col_name: col,
          drop_col: false,
        }))
      );
      setSrcColumns(nodeData.output_cols);
    }
  };

  const handleSave = async (formData: FormData) => {
    const selectedColumns = formData.config
      .filter((column) => column.drop_col)
      .map((column) => column.col_name);
    try {
      if (selectedColumns.length < 1) {
        setValid(false);
        return;
      }
      const postData = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: { columns: selectedColumns },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData.target_model_id || '',
      };

      // api call
      setLoading(true);
      let operationNode: any;
      if (action === 'create') {
        operationNode = await httpPost(session, `transform/dbt_project/model/`, postData);
      } else if (action === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid ? inputModels[0].uuid : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${node?.id}/`,
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
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const { source_columns, columns }: DropDataConfig = opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      const dropCols = source_columns.map((col) => ({
        col_name: col,
        drop_col: columns.includes(col),
      }));
      setValue('config', dropCols);
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

  const filteredFields = fields.filter((field) =>
    field.col_name.toLowerCase().includes(search.toLowerCase())
  );

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
              (column: { col_name: string; drop_col: boolean }, index: number) => [
                <Controller
                  name={`config.${findColumnIndex(column.col_name)}.drop_col`}
                  key={`config.${findColumnIndex(column.col_name)}.key`}
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
                        control={
                          <Checkbox
                            {...field}
                            data-testid={`checkBoxInputContainer${findColumnIndex(
                              column.col_name
                            )}`}
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                            }}
                            sx={{
                              transform: 'scale(0.8)',
                            }}
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
              ]
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

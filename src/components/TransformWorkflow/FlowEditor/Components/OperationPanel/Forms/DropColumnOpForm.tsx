import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';

import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { Controller, useForm } from 'react-hook-form';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import Input from '@/components/UI/Input/Input';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

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
  const [configData, setConfigData] = useState<any>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormData = {
    config: { col_name: string; drop_col: boolean }[];
  };

  const { control, handleSubmit, register, reset, getValues, setValue } =
    useForm<FormData>({
      defaultValues: {
        config: [
          {
            col_name: 'Select All',
            drop_col: false,
          },
        ],
      },
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
      setValue(
        'config',
        source_columns.map((col) => ({
          col_name: col,
          drop_col: columns.includes(col),
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    const trimmedSubstring = search?.toLowerCase();
    const filteredConfigs = config?.filter((ele) => {
      const stringToSearch = ele?.col_name?.toLowerCase();
      return stringToSearch?.includes(trimmedSubstring);
    });
    setConfigData(filteredConfigs);
  };

  useEffect(() => {
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  useEffect(() => {
    setConfigData(config);
  }, [config]);

  useEffect(() => {
    const currentFilteredCols: string[] = configData.map(
      (col: { col_name: string; drop_col: boolean }) => col.col_name
    );
    setValue(
      'config',
      config.map((col) => ({
        ...col,
        drop_col:
          configData?.length > 0 && currentFilteredCols.includes(col.col_name)
            ? selectAll
            : col.drop_col,
      }))
    );
  }, [selectAll]);

  return (
    <Box sx={{ ...sx, marginTop: '17px' }}>
      <Box display="flex">
        <Input
          fieldStyle="transformation"
          sx={{ px: 1, pb: 1, width: '80%' }}
          placeholder="Search Here"
          onChange={(event) => handleSearch(event.target.value)}
        />
        <Tooltip title="Select All Columns">
          <Checkbox
            data-testid="select-all-checkbox"
            checked={selectAll}
            onChange={(e) => {
              setSelectAll(e.target.checked);
            }}
          />
        </Tooltip>
      </Box>
      <form onSubmit={handleSubmit(handleSave)}>
        {!valid && (
          <FormHelperText sx={{ color: 'red', ml: 3 }}>
            Please select atleast 1 column
          </FormHelperText>
        )}
        <GridTable
          headers={['Column name', 'Drop ?']}
          data={configData.map(
            (
              column: { col_name: string; drop_col: boolean },
              index: number
            ) => [
              <Input
                data-testid={`columnName${findColumnIndex(column.col_name)}`}
                key={`config.${findColumnIndex(column.col_name)}.col_name`}
                fieldStyle="none"
                sx={{ padding: '0' }}
                name={`config.${findColumnIndex(column.col_name)}.col_name`}
                register={register}
                value={column.col_name}
                disabled={true}
              />,
              <Controller
                name={`config.${findColumnIndex(column.col_name)}.drop_col`}
                key={`config.${findColumnIndex(column.col_name)}.drop_col`}
                control={control}
                render={({ field }) => (
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
                      />
                    }
                    label=""
                  />
                )}
              />,
            ]
          )}
        ></GridTable>
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

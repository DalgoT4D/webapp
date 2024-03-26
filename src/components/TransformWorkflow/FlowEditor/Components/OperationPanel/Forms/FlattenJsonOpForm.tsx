import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  SxProps,
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

const castGridStyles: {
  container: SxProps;
  headerItem: SxProps;
  item: SxProps;
} = {
  container: {
    border: '1px solid #F9F9F9',
    color: '#5E5E5E',
    alignItems: 'center',
  },
  headerItem: {
    background: '#F9F9F9',
    padding: '9px 16px 9px 16px',
  },
  item: {
    border: '1px solid #F9F9F9',
    padding: '9px 16px 9px 16px',
  },
};

const FlattenJsonOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<ColumnData[]>([]);
  const [jsonColumns, setJsonColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      json_column: '',
    },
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const columnData: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(columnData);
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      console.log(nodeData, 'node data');
      setSrcColumns(
        nodeData.output_cols.map((column: any) => ({ name: column }))
      );
    }
  };

  const fetchJsonColumns = async (selectedColumn: string) => {
    try {
      const response = await httpGet(
        session,
        `warehouse/dbt_project/json_columnspec/?source_schema=${nodeData.schema}&input_name=${nodeData.input_name}&json_column=${selectedColumn}`
      );
      // Rename JSON columns to avoid name clashes
      const renamedColumns = response.map((column: string) => `_${column}`);
      setJsonColumns(renamedColumns);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAndSetSourceColumns();
  }, [session]);

  const handleSave = async (formData: any) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns.map((column) => column.name),
        other_inputs: [],
        config: {
          json_column: formData.json_column,
          source_schema: nodeData?.schema,
          json_columns_to_copy: jsonColumns,
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      // validations
      if (Object.keys(postData.config.json_column).length === 0) {
        console.log('Please select the json column to flatten');
        errorToast(
          'Please select the json column to flatten',
          [],
          globalContext
        );
        return;
      }

      // api call
      const operationNode: any = await httpPost(
        session,
        `transform/dbt_project/model/`,
        postData
      );

      // Handle the response
      continueOperationChain(operationNode);
      reset();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box sx={{ ...sx, marginTop: '17px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container sx={{ ...castGridStyles.container }}>
          <Grid item xs={12} sx={{ ...castGridStyles.headerItem }}>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '12px',
                lineHeight: '19.2px',
                letterSpacing: '2%',
              }}
            >
              Select JSON Column
            </Typography>
          </Grid>

          <Grid item xs={12} sx={{ ...castGridStyles.item }}>
            <Controller
              control={control}
              name="json_column"
              render={({ field }) => (
                <Autocomplete
                  options={srcColumns.map((column) => column.name)}
                  value={field.value}
                  onChange={(event, value) => {
                    field.onChange(value);
                    if (value !== null) {
                      fetchJsonColumns(value);
                    }
                  }}
                  renderInput={(params) => (
                    <Input {...params} sx={{ width: '100%' }} />
                  )}
                />
              )}
            />
          </Grid>

          {/* Options for JSON columns */}
          {jsonColumns.length > 0 && (
            <Grid item xs={12} sx={{ ...castGridStyles.headerItem }}>
              <Typography
                sx={{
                  fontWeight: '600',
                  fontSize: '12px',
                  lineHeight: '19.2px',
                  letterSpacing: '2%',
                  marginTop: '16px', // Add margin top
                }}
              >
                JSON Columns
              </Typography>
            </Grid>
          )}

          {jsonColumns.length > 0 &&
            jsonColumns.map((column, index) => (
              <Grid key={index} item xs={12} sx={{ ...castGridStyles.item }}>
                <Typography>{column}</Typography>
              </Grid>
            ))}
        </Grid>
        <Box sx={{ ...sx, padding: '16px 16px 0px 16px' }}>
          <Button
            variant="outlined"
            type="submit"
            data-testid="savebutton"
            fullWidth
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default FlattenJsonOpForm;

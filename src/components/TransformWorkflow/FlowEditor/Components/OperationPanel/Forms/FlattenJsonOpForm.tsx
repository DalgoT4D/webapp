import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, Grid, SxProps, Typography } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useForm } from 'react-hook-form';

import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';

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

interface FlattejsonDataConfig {
  source_columns: string[];
  other_inputs: any[];
  json_column: string;
  json_columns_to_copy: string[];
  source_schema: string;
}

const FlattenJsonOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  action,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [jsonColumns, setJsonColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, handleSubmit, reset, register } = useForm({
    defaultValues: {
      json_column: '',
    },
  });

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

  const fetchJsonColumns = async (selectedColumn: string) => {
    // while edit fetch schema and input name from input models
    try {
      const response = await httpGet(
        session,
        `warehouse/dbt_project/json_columnspec/?source_schema=${
          action !== 'edit' ? nodeData.schema : inputModels[0].schema
        }&input_name=${
          action !== 'edit' ? nodeData.input_name : inputModels[0].name
        }&json_column=${selectedColumn}`
      );
      setJsonColumns(response);
    } catch (error) {
      setJsonColumns([]);
      console.log(error);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: {
          json_column: formData.json_column,
          source_schema: nodeData?.schema,
          json_columns_to_copy: jsonColumns,
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

      // Handle the response
      continueOperationChain(operationNode);
      reset();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAndSetConfigForEdit = async () => {
    try {
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const {
        source_columns,
        json_column,
        json_columns_to_copy,
      }: FlattejsonDataConfig = opConfig;
      setSrcColumns(source_columns);
      setJsonColumns(json_columns_to_copy);

      // pre-fill form
      reset({
        json_column: json_column,
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
  }, [session, node]);

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
              render={({ field, fieldState }) => (
                <Autocomplete
                  name={field.name}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error && 'JSON column is required'}
                  register={register}
                  fieldStyle="transformation"
                  disabled={action === 'view'}
                  options={srcColumns}
                  value={field.value}
                  onChange={(event, value) => {
                    field.onChange(value);
                    if (value !== null) {
                      fetchJsonColumns(value);
                    }
                  }}
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
            disabled={action === 'view'}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default FlattenJsonOpForm;

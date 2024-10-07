import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, Grid, SxProps, Typography } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useForm } from 'react-hook-form';

import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { useOpForm } from '@/customHooks/useOpForm';

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
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [jsonColumns, setJsonColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const { parentNode, nodeData } = useOpForm({
    props: {
      node,
      operation,
      sx,
      continueOperationChain,
      action,
      setLoading,
    },
  });
  const { control, handleSubmit, reset } = useForm({
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
        setSrcColumns(data.map((col: ColumnData) => col.name).sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setSrcColumns(nodeData.output_cols.sort((a: string, b: string) => a.localeCompare(b)));
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
    const finalNode = node?.data.isDummy ? parentNode : node; //change  //this checks for edit case too.
    const finalAction = node?.data.isDummy ? 'create' : action; //change
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
        input_uuid: finalNode?.type === SRC_MODEL_NODE ? finalNode?.id : '',
        target_model_uuid: finalNode?.data.target_model_id || '',
      };

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        operationNode = await httpPost(session, `transform/dbt_project/model/`, postData);
      } else if (finalAction === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid ? inputModels[0].uuid : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${finalNode?.id}/`,
          postData
        );
      }

      // Handle the response
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
      const { source_columns, json_column, json_columns_to_copy }: FlattejsonDataConfig = opConfig;
      setSrcColumns(source_columns);
      setJsonColumns(json_columns_to_copy);

      // pre-fill form
      reset({
        json_column: json_column,
      });
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
              rules={{ required: 'JSON column is required' }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  data-testid="jsonColumn"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fieldStyle="transformation"
                  disabled={action === 'view'}
                  options={srcColumns}
                  onChange={(value: any) => {
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

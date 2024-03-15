import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Autocomplete, Box, Button, Grid, TextField } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { GlobalContext } from '@/contexts/ContextProvider';

import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';

const DropColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
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

  const handleSave = async (data: any) => {
    try {
      const columnsToDrop = Array.isArray(data.columnsToDrop)
        ? data.columnsToDrop
        : [data.columnsToDrop];

      const postData = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: { columns: {} as { [key: string]: string } },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData.target_model_id || '',
      };

      srcColumns.forEach((col: string) => {
        if (columnsToDrop.includes(col)) {
          postData.config.columns[col] = col;
        }
      });

      // validations
      if (columnsToDrop.length === 0) {
        console.log('Please select columns to drop');
        errorToast('Please select columns to drop', [], globalContext);
        return;
      }

      // api call
      console.log(postData, 'post data');
      const operationNode = await httpPost(
        session,
        `transform/dbt_project/model/`,
        postData
      );

      continueOperationChain(operationNode);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAndSetSourceColumns();
  }, [session]);

  return (
    <Box sx={{ ...sx, marginTop: '17px', padding: '20px' }}>
      <form onSubmit={handleSave}>
        <Grid container>
          <Grid item xs={12}>
            <Autocomplete
              options={srcColumns}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Select Columns to Drop"
                />
              )}
              onChange={(e, value) => handleSave({ columnsToDrop: value })}
            />
          </Grid>
          <Grid item xs={12} sx={{ marginTop: '40px' }}>
            <Button variant="outlined" type="submit" fullWidth>
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default DropColumnOp;

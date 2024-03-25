import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { GlobalContext } from '@/contexts/ContextProvider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import Input from '@/components/UI/Input/Input';

const DropColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [column, setColumn] = useState('');
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

  const handleAddColumn = (column: string) => {
    setSelectedColumns((prevColumns) => [...prevColumns, column]);
  };

  const handleRemoveColumn = (column: string) => {
    setSelectedColumns((prevColumns) =>
      prevColumns.filter((col) => col !== column)
    );
  };

  const handleSave = async () => {
    try {
      const postData = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: { columns: selectedColumns },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData.target_model_id || '',
      };

      // validations
      if (selectedColumns.length === 0) {
        console.log('Please select columns to drop');
        errorToast('Please select columns to drop', [], globalContext);
        return;
      }

      // api call
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
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Select Columns to Drop</Typography>
        </Grid>
        {[...selectedColumns].reverse().map((column, index) => (
          <Grid item xs={12} key={index}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Input
                  fieldStyle="transformation"
                  disabled
                  variant="outlined"
                  value={column}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleRemoveColumn(column)}>
                          <CloseIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Autocomplete
            value={column}
            inputValue={column}
            fieldStyle="transformation"
            options={srcColumns
              .filter((col) => !selectedColumns.includes(col))
              .sort((a, b) => a.localeCompare(b))}
            label="Select Column to Drop"
            onChange={(e, value: any) => {
              if (value) {
                handleAddColumn(value);
                setColumn('');
              }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DropColumnOp;

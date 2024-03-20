import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  SxProps,
  TextField,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';

const renameGridStyles: {
  container: SxProps;
  headerItem: SxProps;
  item: SxProps;
} = {
  container: {
    border: '1px solid #F9F9F9',
    color: '#5E5E5E',
  },
  headerItem: {
    background: '#F9F9F9',
    padding: '9px 16px 9px 16px',
  },
  item: {
    background: '#F9F9F9',
    border: '1px solid #F9F9F9',
    padding: '9px 16px 9px 16px',
  },
};

const AggregationOpForm = ({
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
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: {
      columns: [{ col: '' }],
      operation: '',
      output_col_name: '',
    },
  });
  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'columns',
  });

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
      if (selectedColumns.length === 0) {
        errorToast('Please select columns to aggregate', [], globalContext);
        return;
      }

      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        config: {
          //   columns: selectedColumns,
          aggregate_on: [
            {
              operation: selectedOperation,
              column: selectedColumns[0],
              output_col_name: data.output_col_name,
            },
          ],
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
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        {fields.map((field, index) => (
          <>
            <Autocomplete
              options={srcColumns.filter(
                (col) => !selectedColumns.includes(col)
              )}
              onChange={(e, data) => {
                if (data && typeof data === 'string') {
                  setSelectedColumns([...selectedColumns, data]);
                }
              }}
              renderInput={(params) => (
                <Input {...params} label="Select Column to Aggregate" />
              )}
            />

            <Controller
              control={control}
              name={`columns.${index}.col`}
              render={({ field }) => (
                <Autocomplete
                  options={[
                    { value: 'sum', label: 'Sum' },
                    { value: 'avg', label: 'Average' },
                    { value: 'count', label: 'Count' },
                    { value: 'min', label: 'Minimum' },
                    { value: 'max', label: 'Maximum' },
                    { value: 'countdistinct', label: 'Count Distinct' },
                  ]}
                  onChange={(e, data) => {
                    setSelectedOperation(data ? data.value : '');
                  }}
                  renderInput={(params) => (
                    <Input
                      {...params}
                      sx={{ width: '100%', marginTop: '16px' }}
                      label="Aggregate"
                    />
                  )}
                />
              )}
            />
            <Input
              label="Output Column Name"
              sx={{ padding: '0', marginTop: '16px' }}
              name="output_col_name"
              register={register}
              required
            />
          </>
        ))}
        <Box>
          <Box sx={{ m: 2 }} />
          <Box>
            <Button
              variant="outlined"
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

export default AggregationOpForm;

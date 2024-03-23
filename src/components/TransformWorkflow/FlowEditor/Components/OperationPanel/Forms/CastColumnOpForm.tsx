import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, Grid, SxProps, Typography } from '@mui/material';
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

const CastColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<ColumnData[]>([]);
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, handleSubmit, register, reset } = useForm({
    defaultValues: {
      config: srcColumns.map(() => ({ column: '', dataType: '' })),
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

        // Fetch data types from the other API
        const response = await httpGet(
          session,
          `transform/dbt_project/data_type/`
        );
        setDataTypes(response);
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

  const handleSave = async (formData: any) => {
    try {
      const sourceColumnsNames = srcColumns.map((column) => column.name);

      const postData: any = {
        op_type: operation.slug,
        source_columns: sourceColumnsNames,
        other_inputs: [],
        config: { columns: [] },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      formData.config.forEach((data: any) => {
        if (data.column && data.dataType) {
          postData.config.columns.push({
            columnname: data.column,
            columntype: data.dataType,
          });
        }
      });

      // validations
      if (Object.keys(postData.config.columns).length === 0) {
        console.log('Please add columns to cast');
        errorToast('Please add columns to cast', [], globalContext);
        return;
      }

      // Make the API call
      const operationNode: any = await httpPost(
        session,
        `transform/dbt_project/model/`,
        postData
      );

      console.log(operationNode, 'operation node');

      // Handle the response
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
    <Box sx={{ ...sx, marginTop: '17px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container sx={{ ...castGridStyles.container }}>
          <Grid item xs={6} sx={{ ...castGridStyles.headerItem }}>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '12px',
                lineHeight: '19.2px',
                letterSpacing: '2%',
              }}
            >
              Column
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ ...castGridStyles.headerItem }}>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '12px',
                lineHeight: '19.2px',
                letterSpacing: '2%',
              }}
            >
              Data Type
            </Typography>
          </Grid>

          {srcColumns.map((column, index) => (
            <React.Fragment key={index}>
              <Grid item xs={6} sx={{ ...castGridStyles.item }}>
                <Input
                  sx={{ padding: '0' }}
                  name={`config.${index}.column`}
                  register={register}
                  value={column.name}
                />
              </Grid>
              <Grid item xs={6} sx={{ ...castGridStyles.item }}>
                <Controller
                  control={control}
                  name={`config.${index}.dataType`}
                  render={({ field }) => (
                    <Autocomplete
                      fieldStyle="transformation"
                      options={dataTypes}
                      value={column.data_type}
                      onChange={(e, data) => {
                        field.onChange(data);
                      }}
                    />
                  )}
                />
              </Grid>
            </React.Fragment>
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

export default CastColumnOp;

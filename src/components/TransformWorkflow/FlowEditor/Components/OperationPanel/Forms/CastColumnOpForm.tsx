import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
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
import { GridTable } from '@/components/UI/GridTable/GridTable';

const CastColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, handleSubmit, register, reset, getValues, setValue } =
    useForm({
      defaultValues: {
        config: [
          {
            name: '',
            data_type: '',
          },
        ] as ColumnData[],
      },
    });

  const { config } = getValues();

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const columnData: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );

        setValue('config', columnData);

        // Fetch data types from the other API
        const response = await httpGet(
          session,
          `transform/dbt_project/data_type/`
        );
        setDataTypes(
          response.sort((a: string, b: string) => a.localeCompare(b))
        );
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      console.log(nodeData, 'node data');
      setValue(
        'config',
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
        if (data.name && data.data_type) {
          postData.config.columns.push({
            columnname: data.name,
            columntype: data.data_type,
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
        <GridTable
          headers={['Column name', 'Type']}
          data={config.map((column, index) => [
            <Input
              key={`config.${index}.name`}
              fieldStyle="none"
              sx={{ padding: '0' }}
              name={`config.${index}.name`}
              register={register}
              value={column.name}
            />,
            <Controller
              key={`config.${index}.data_type`}
              control={control}
              name={`config.${index}.data_type`}
              render={({ field }) => (
                <Autocomplete
                  disableClearable
                  fieldStyle="none"
                  options={dataTypes}
                  value={column.data_type}
                  onChange={(e, data) => {
                    field.onChange(data);
                  }}
                />
              )}
            />,
          ])}
        ></GridTable>
        <Box sx={{ ...sx, padding: '16px 16px 0px 16px' }}>
          <Button
            variant="contained"
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

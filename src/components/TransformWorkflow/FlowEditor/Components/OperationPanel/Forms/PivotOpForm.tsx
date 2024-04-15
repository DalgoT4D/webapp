import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';

const PivotOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    pivot_column_name: string;
    pivot_column_values: {
      col: string;
    }[];
  };

  const { control, register, handleSubmit, reset } = useForm<FormProps>({
    defaultValues: {
      pivot_column_name: '',
      pivot_column_values: [
        {
          col: '',
        },
      ],
    },
  });

  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pivot_column_values',
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

  const handleSave = async (data: FormProps) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        config: {
          pivot_column_name: data.pivot_column_name,
          pivot_column_values: data.pivot_column_values
            .filter((item) => item.col)
            .map((item) => item.col),
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      setLoading(true);
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

      continueOperationChain(operationNode);
      reset();
    } catch (error: any) {
      console.log(error);
      errorToast(error?.message, [], globalContext);
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
      //   const { source_columns, aggregate_on }: AggregateDataConfig = opConfig;
      //   setSrcColumns(source_columns);

      //   // pre-fill form
      //   reset({
      //     aggregate_on: aggregate_on.map((item: AggregateOn) => ({
      //       column: item.column,
      //       operation: AggregateOperations.find((op) => op.id === item.operation),
      //       output_column_name: item.output_column_name,
      //     })),
      //   });
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

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box sx={{ mb: 2 }}>
          <Controller
            control={control}
            name={`pivot_column_name`}
            render={({ field }) => (
              <Autocomplete
                disabled={action === 'view'}
                fieldStyle="transformation"
                options={srcColumns.sort((a, b) => a.localeCompare(b))}
                value={field.value}
                onChange={(e, data) => {
                  if (data) field.onChange(data);
                }}
                label="Select Column to pivot on*"
              />
            )}
          />
        </Box>
        <GridTable
          headers={['Column values to pivot on']}
          removeItem={(index: number) => remove(index)}
          data={fields.map((field, idx) => [
            <Input
              disabled={action === 'view'}
              fieldStyle="none"
              key={field.col + idx}
              name={`pivot_column_values.${idx}.col`}
              register={register}
            />,
          ])}
        ></GridTable>
        <Button
          variant="shadow"
          type="button"
          data-testid="addcase"
          sx={{ m: 2 }}
          onClick={(event) => {
            append({ col: '' });
          }}
        >
          Add row
        </Button>
        <Box>
          <Box>
            <Button
              disabled={action === 'view'}
              variant="contained"
              type="button"
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

export default PivotOpForm;

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
import { GridTable } from '@/components/UI/GridTable/GridTable';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';

interface RenameDataConfig {
  columns: { [key: string]: string };
  source_columns: string[];
}

const RenameColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  action,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const globalContext = useContext(GlobalContext);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, register, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      config: [{ old: '', new: '' }],
    },
  });

  const { config } = getValues();
  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({ control, name: 'config' });

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
      setSrcColumns(nodeData.output_cols);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: { columns: {} },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };
      data.config.forEach((item: any) => {
        if (item.old && item.new) postData.config.columns[item.old] = item.new;
      });

      // validations
      if (Object.keys(postData.config.columns).length === 0) {
        console.log('Please add columns to rename');
        errorToast('Please add columns to rename', [], globalContext);
        return;
      }

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
      const { columns, source_columns }: RenameDataConfig = opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      const renamedColumnArray = Object.keys(columns).map((key) => ({
        old: key,
        new: columns[key],
      }));
      renamedColumnArray.push({ old: '', new: '' });
      reset({ config: renamedColumnArray });
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

  const options = srcColumns.filter(
    (column) => !config.map((con) => con.old).includes(column)
  );

  return (
    <Box sx={{ ...sx, marginTop: '17px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <GridTable
          removeItem={
            action === 'view'
              ? undefined
              : (index: number) => {
                  remove(index);
                }
          }
          headers={['Current Name', 'New Name']}
          data={fields.map((field, index) => [
            <Controller
              key={field.old + index}
              control={control}
              name={`config.${index}.old`}
              render={({ field }) => (
                <Autocomplete
                  disabled={action === 'view'}
                  disableClearable
                  fieldStyle="none"
                  options={options}
                  value={field.value}
                  placeholder="Select column"
                  onChange={(e, data) => {
                    field.onChange(data);
                  }}
                />
              )}
            />,
            <Input
              fieldStyle="none"
              key={field.new + index}
              sx={{ padding: '0' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  append({ old: '', new: '' });
                }
              }}
              name={`config.${index}.new`}
              register={register}
              disabled={action === 'view'}
            />,
          ])}
        ></GridTable>

        <Button
          disabled={action === 'view'}
          variant="shadow"
          type="button"
          data-testid="addcase"
          sx={{ m: 2 }}
          onClick={(event) => {
            append({ old: '', new: '' });
          }}
        >
          Add column
        </Button>

        <Box sx={{ m: 2 }}>
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

export default RenameColumnOp;

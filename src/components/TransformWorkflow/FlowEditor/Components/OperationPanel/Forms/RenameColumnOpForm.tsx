import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText } from '@mui/material';
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
  action,
  setLoading,
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

  const { control, handleSubmit, reset, getValues, formState } = useForm({
    defaultValues: {
      config: [{ old: '', new: '' }],
    },
  });

  const { config } = getValues();
  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'config',
    rules: {
      validate: {
        notAllEmpty: (value) =>
          value.some((item) => item.old !== '' || item.new !== '') ||
          'Alteast one column is required',
      },
    },
  });

  useEffect(() => {
    if (fields.length > 0) {
      const lastInputId = `#config${fields.length - 1}old`;
      const lastInput = document.querySelector(lastInputId) as HTMLInputElement;
      if (lastInput) lastInput.focus();
    }
  }, [fields]);

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

      // api call
      setLoading(true);
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
                  {...field}
                  data-testid={`currentName${index}`}
                  id={`config${index}old`}
                  onChange={(data: any) => {
                    field.onChange(data);
                    const nextAutocompletIndex = document.querySelector(
                      `#config${index}new`
                    ) as HTMLInputElement;
                    if (nextAutocompletIndex) nextAutocompletIndex?.focus();
                  }}
                  disabled={action === 'view'}
                  disableClearable
                  fieldStyle="none"
                  options={options}
                  placeholder="Select column"
                />
              )}
            />,
            <Controller
              key={field.new + index}
              control={control}
              name={`config.${index}.new`}
              render={({ field }) => (
                <Input
                  {...field}
                  data-testid={`newName${index}`}
                  id={`config${index}new`}
                  fieldStyle="none"
                  sx={{ padding: '0' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      append({ old: '', new: '' });
                    }
                  }}
                  disabled={action === 'view'}
                />
              )}
            />,
          ])}
        ></GridTable>
        {formState.errors.config && (
          <FormHelperText sx={{ color: 'red', ml: 2 }}>
            {formState.errors.config.root?.message}
          </FormHelperText>
        )}

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
        <Box sx={{ m: 2 }} />
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            pb: 2,
            px: 2,
          }}
        >
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

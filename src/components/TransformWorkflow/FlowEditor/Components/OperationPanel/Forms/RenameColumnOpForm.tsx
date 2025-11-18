import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { useOpForm } from '@/customHooks/useOpForm';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

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
  const globalContext = useContext(GlobalContext);

  const { control, handleSubmit, reset, getValues, formState, watch } = useForm({
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
    if (node) {
      setSrcColumns(node.data.output_columns);
    }
  };

  const handleSave = async (data: any) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action;
    try {
      let opConfig: any = { columns: {} };

      config.forEach((item: any) => {
        if (item.old && item.new) opConfig.columns[item.old] = item.new;
      });

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        const payloadData: CreateOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          other_inputs: [],
          config: opConfig,
          input_node_uuid: finalNode?.id || '',
        };
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          payloadData
        );
      } else if (finalAction === 'edit') {
        const payloadData: EditOperationNodePayload = {
          op_type: operation.slug,
          source_columns: srcColumns,
          other_inputs: [],
          config: opConfig,
        };
        operationNode = await httpPut(
          session,
          `transform/v2/dbt_project/operations/nodes/${finalNode?.id}/`,
          payloadData
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
      const nodeResponeData: CanvasNodeDataResponse = await httpGet(
        session,
        `transform/v2/dbt_project/nodes/${node?.id}/`
      );
      const { operation_config, input_nodes } = nodeResponeData;

      // form data; will differ based on operations in progress
      const { columns, source_columns }: RenameDataConfig = operation_config.config;
      setSrcColumns(source_columns);

      // pre-fill form
      const renamedColumnArray = Object.keys(columns).map((key) => ({
        old: key,
        new: columns[key],
      }));
      if (renamedColumnArray.length < source_columns.length) {
        renamedColumnArray.push({ old: '', new: '' });
      }
      reset({ config: renamedColumnArray });
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

  const options = srcColumns.filter((column) => !config.map((con) => con.old).includes(column));
  const configValues = watch('config'); //useful for rendering while selecting options or for input.

  const disableCondition =
    configValues.length >= srcColumns.length ||
    configValues.at(-1)?.new === '' ||
    configValues.at(-1)?.old === '';

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
                  value={field.value}
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
                  value={field.value}
                  sx={{ padding: '0' }}
                  onChange={(e) => field.onChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (disableCondition) return;
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
          disabled={action === 'view' || disableCondition}
          variant="shadow"
          type="button"
          data-testid="addcase"
          sx={{ m: 2 }}
          onClick={(event) => {
            if (disableCondition) return;
            append({ old: '', new: '' });
          }}
        >
          Add column
        </Button>
        <Box sx={{ m: 2 }} />
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2, px: 2 }}>
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

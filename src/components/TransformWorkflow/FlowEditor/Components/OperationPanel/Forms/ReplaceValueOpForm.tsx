import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';

const ReplaceValueOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
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

  const { control, register, handleSubmit, reset } = useForm<{
    config: Array<{ old: string; new: string }>;
    column_name: '';
  }>({
    defaultValues: {
      column_name: '',
      config: [{ old: '', new: '' }],
    },
  });
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
      const output_column_name = data.column_name;

      if (!output_column_name) {
        errorToast('Please select a column', [], globalContext);
        return;
      }

      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns.filter((col) => col !== output_column_name),
        other_inputs: [],
        config: {
          columns: [
            {
              col_name: output_column_name,
              output_column_name: output_column_name,
              replace_ops: [],
            },
          ],
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      data.config.forEach((item: any) => {
        if (item.old && item.new)
          postData.config.columns[0].replace_ops.push({
            find: item.old,
            replace: item.new,
          });
      });

      // validations
      if (postData.config.columns[0].replace_ops.length === 0) {
        console.log('Please add values to replace');
        errorToast('Please add values to replace', [], globalContext);
        return;
      }

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
    <Box>
      <form
        onSubmit={handleSubmit(handleSave)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }}
      >
        <Box sx={{ ...sx, padding: '32px 16px 0px 16px', mb: 2 }}>
          <Controller
            control={control}
            name="column_name"
            render={({ field }) => (
              <Autocomplete
                options={srcColumns}
                value={field.value}
                onChange={(e, data) => {
                  field.onChange(data);
                }}
                label="Select a column*"
                fieldStyle="transformation"
              />
            )}
          />
        </Box>

        <GridTable
          headers={['Column value', 'Replace with']}
          removeItem={(index: number) => remove(index)}
          data={fields.map((field, idx) => [
            <Input
              fieldStyle="none"
              key={field.old + idx}
              name={`config.${idx}.old`}
              register={register}
            />,
            <Input
              fieldStyle="none"
              key={field.new + idx}
              name={`config.${idx}.new`}
              register={register}
              onKeyDown={(e) => {
                // if the key is enter append
                if (e.key === 'Enter') {
                  append({ old: '', new: '' });
                }
              }}
            />,
          ])}
        ></GridTable>

        <Button
          variant="shadow"
          type="button"
          data-testid="addcase"
          sx={{ m: 2 }}
          onClick={(event) => {
            append({ old: '', new: '' });
          }}
        >
          Add row
        </Button>

        <Box sx={{ m: 2 }}>
          <Button
            variant="contained"
            type="submit"
            data-testid="savebutton"
            fullWidth
            sx={{ marginTop: '17px' }}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ReplaceValueOpForm;

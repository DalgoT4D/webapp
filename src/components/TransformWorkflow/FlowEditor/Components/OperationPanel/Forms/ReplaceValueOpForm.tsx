import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import { parseStringForNull } from '@/utils/common';
import { useOpForm } from '@/customHooks/useOpForm';

interface ReplaceOp {
  find: string;
  replace: string;
}

interface ReplaceDataConfig {
  source_columns: string[];
  other_inputs: any[];
  columns: {
    col_name: string;
    output_column_name: string;
    replace_ops: ReplaceOp[];
  }[];
}

const ReplaceValueOpForm = ({
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

  const { parentNode, nodeData } = useOpForm({
    props: {
      node,
      operation,
      sx,
      continueOperationChain,
      action,
      setLoading,
    },
  });

  const { control, register, handleSubmit, reset, formState } = useForm<{
    config: Array<{ old: string; new: string }>;
    column_name: string;
  }>({
    defaultValues: {
      column_name: '',
      config: [{ old: '', new: '' }],
    },
  });
  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'config',
    rules: {
      validate: {
        notAllEmpty: (value) =>
          value.some((item) => item.old !== '' || item.new !== '') ||
          'Atleast one value is required',
      },
    },
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      //change
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name).sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setSrcColumns(nodeData.output_cols);
    }
  };

  const handleSave = async (data: any) => {
    const finalNode = node?.data.isDummy ? parentNode : node; //change  //this checks for edit case too.
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      const output_column_name = data.column_name;

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
        input_uuid: finalNode?.type === SRC_MODEL_NODE ? finalNode?.id : '',
        target_model_uuid: finalNode?.data.target_model_id || '',
      };

      data.config.forEach((item: any) => {
        if (item.old || item.new)
          postData.config.columns[0].replace_ops.push({
            find: parseStringForNull(item.old),
            replace: parseStringForNull(item.new),
          });
      });

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        operationNode = await httpPost(session, `transform/dbt_project/model/`, postData);
      } else if (finalAction === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid ? inputModels[0].uuid : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${finalNode?.id}/`,
          postData
        );
      }

      continueOperationChain(operationNode);
      reset();
    } catch (error) {
      console.log(error);
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
      const { source_columns, columns }: ReplaceDataConfig = opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      if (columns.length === 1) {
        const replaceValArray: { old: string; new: string }[] = columns[0].replace_ops.map(
          (item: ReplaceOp) => ({
            old: item.find,
            new: item.replace,
          })
        );
        replaceValArray.push({ old: '', new: '' });
        reset({
          column_name: columns[0].col_name,
          config: replaceValArray,
        });
      }
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
            rules={{ required: 'Column is required' }}
            render={({ field, fieldState }) => (
              <Autocomplete
                {...field}
                data-testid="column"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={action === 'view'}
                options={srcColumns}
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
              data-testid={`columnValue${idx}`}
              disabled={action === 'view'}
              fieldStyle="none"
              key={field.old + idx}
              name={`config.${idx}.old`}
              register={register}
            />,
            <Input
              data-testid={`replacedValue${idx}`}
              disabled={action === 'view'}
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
        {formState.errors.config && (
          <FormHelperText sx={{ color: 'red', ml: 2 }}>
            {formState.errors.config.root?.message}
          </FormHelperText>
        )}

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
        <Box sx={{ m: 2 }} />
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2, px: 2 }}>
          <Button
            variant="contained"
            type="submit"
            data-testid="savebutton"
            fullWidth
            sx={{ marginTop: '17px' }}
            disabled={action === 'view'}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ReplaceValueOpForm;

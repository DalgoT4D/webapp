import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText } from '@mui/material';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import { parseStringForNull } from '@/utils/common';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

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
    if (node) {
      setSrcColumns(node.data.output_columns.sort((a, b) => a.localeCompare(b)));
    }
  };

  const handleSave = async (data: any) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      const output_column_name = data.column_name;

      const opConfig: any = {
        columns: [
          {
            col_name: output_column_name,
            output_column_name: output_column_name,
            replace_ops: [],
          },
        ],
      };

      data.config.forEach((item: any) => {
        if (item.old || item.new)
          opConfig.columns[0].replace_ops.push({
            find: parseStringForNull(item.old),
            replace: parseStringForNull(item.new),
          });
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
    } catch (error) {
      console.log(error);
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
      const { source_columns, columns }: ReplaceDataConfig = operation_config.config;
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

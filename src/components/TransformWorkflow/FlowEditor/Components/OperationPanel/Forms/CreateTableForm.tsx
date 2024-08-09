import React from 'react';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Controller, useForm } from 'react-hook-form';
import { Box, Button } from '@mui/material';
import Input from '@/components/UI/Input/Input';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';
import { OPERATION_NODE } from '../../../constant';
import { OperationNodeData, OperationNodeType } from '../../Canvas';
import { httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';

const CreateTableForm = ({ sx, clearAndClosePanel }: OperationFormProps) => {
  const { data: session } = useSession();
  const { canvasNode } = useCanvasNode() as { canvasNode: OperationNodeType };
  const { setCanvasAction } = useCanvasAction();
  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: canvasNode?.data.is_last_in_chain
      ? {
          output_name: canvasNode?.data.target_model_name || '',
          dest_schema: canvasNode?.data.target_model_schema || '',
        }
      : { output_name: '', dest_schema: '' },
  });

  const handleCreateTableAndRun = async (data: any) => {
    if (canvasNode?.type === OPERATION_NODE) {
      const nodeData = canvasNode?.data as OperationNodeData;
      try {
        await httpPost(
          session,
          `transform/dbt_project/model/${nodeData?.target_model_id}/save/`,
          {
            name: data.output_name,
            display_name: data.output_name,
            dest_schema: data.dest_schema,
          }
        );
        reset();
        setCanvasAction({ type: 'run-workflow', data: null });
        if (clearAndClosePanel) {
          clearAndClosePanel();
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleCreateTableAndRun)}>
        <Input
          fieldStyle="transformation"
          label="Output Name"
          sx={{ padding: '0' }}
          name="output_name"
          register={register}
          required
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name="dest_schema"
          render={({ field }) => (
            <Autocomplete
              fieldStyle="transformation"
              options={['intermediate', 'production']}
              {...field}
              label="Output Schema Name"
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Button
          variant="contained"
          type="submit"
          data-testid="savebutton"
          fullWidth
        >
          Save
        </Button>
      </form>
    </Box>
  );
};

export default CreateTableForm;

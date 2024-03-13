import React from 'react';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Controller, useForm } from 'react-hook-form';
import { Autocomplete, Box, Button } from '@mui/material';
import Input from '@/components/UI/Input/Input';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';
import { OPERATION_NODE } from '../../../constant';
import { OperationNodeData } from '../../Canvas';
import { httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';

const CreateTableForm = ({
  operation,
  node,
  sx,
  continueOperationChain,
  clearAndClosePanel,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const { canvasNode, setCanvasNode } = useCanvasNode();
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: {
      output_name: '',
      dest_schema: '',
    },
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
        setCanvasAction({ type: 'refresh-canvas', data: null });
        clearAndClosePanel();
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleCreateTableAndRun)}>
        <Input
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
              options={['Intermediate', 'Production']}
              value={field.value}
              onChange={(e, data) => {
                field.onChange(data);
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  sx={{ width: '100%' }}
                  label="Output Schema Name"
                  required
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Button
          variant="outlined"
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

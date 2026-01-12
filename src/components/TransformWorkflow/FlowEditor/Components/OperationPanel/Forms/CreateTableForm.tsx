import React, { useContext, useEffect, useState } from 'react';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Controller, useForm } from 'react-hook-form';
import { Box, Button, FormHelperText } from '@mui/material';
import Input from '@/components/UI/Input/Input';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';

const CreateTableForm = ({ sx, clearAndClosePanel }: OperationFormProps) => {
  const { data: session } = useSession();
  const { canvasNode } = useCanvasNode();
  const { setCanvasAction } = useCanvasAction();
  const globalContext = useContext(GlobalContext);
  const [directories, setDirectories] = useState<{ value: string; label: string }[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState(true);

  const { control, register, handleSubmit, reset, formState } = useForm({
    defaultValues: canvasNode?.data.is_last_in_chain
      ? {
          output_name: canvasNode?.data?.dbtmodel?.name || '',
          dest_schema: canvasNode?.data?.dbtmodel?.schema || '',
          rel_dir_to_models: '',
        }
      : { output_name: '', dest_schema: '', rel_dir_to_models: '' },
  });

  // Fetch directories when component mounts
  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        setLoadingDirectories(true);
        const response = await httpGet(session, 'transform/v2/dbt_project/models_directories/');

        // Format directories for display
        const formattedDirectories = response.directories.map((dir: string) => ({
          value: dir,
          label: dir === '' ? '/' : `${dir}/`,
        }));

        setDirectories(formattedDirectories);
      } catch (error: any) {
        console.error('Error fetching directories:', error);
        errorToast('Failed to load model directories', [], globalContext);
        // Set default directories as fallback
        setDirectories([
          { value: '', label: '/' },
          { value: 'intermediate', label: 'intermediate/' },
          { value: 'production', label: 'production/' },
        ]);
      } finally {
        setLoadingDirectories(false);
      }
    };

    if (session) {
      fetchDirectories();
    }
  }, [session, globalContext]);

  const handleCreateTableAndRun = async (data: any) => {
    if (canvasNode?.type === 'operation') {
      try {
        await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/${canvasNode.id}/terminate/`,
          {
            name: data.output_name,
            display_name: data.output_name,
            dest_schema: data.dest_schema,
            rel_dir_to_models:
              typeof data.rel_dir_to_models === 'string'
                ? data.rel_dir_to_models
                : data.rel_dir_to_models?.value || '',
          }
        );
        reset();
        setCanvasAction({ type: 'run-workflow', data: null });
        if (clearAndClosePanel) {
          clearAndClosePanel();
        }
      } catch (error: any) {
        console.log(error.message);
        errorToast(error.message, [], globalContext);
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
        {formState?.errors?.output_name && (
          <FormHelperText error>Output name is required</FormHelperText>
        )}
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name="dest_schema"
          rules={{ required: true }}
          render={({ field }) => (
            <Autocomplete
              fieldStyle="transformation"
              options={['intermediate', 'production']}
              {...field}
              freeSolo
              autoSelect
              label="Output Schema Name*"
            />
          )}
        />
        {formState?.errors?.dest_schema && (
          <FormHelperText error>Output schema is required</FormHelperText>
        )}
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name="rel_dir_to_models"
          rules={{ required: true }}
          render={({ field }) => (
            <Autocomplete
              fieldStyle="transformation"
              options={directories}
              loading={loadingDirectories}
              {...field}
              freeSolo
              autoSelect
              label="Directory under models*"
              placeholder="Select or type directory under models/"
              getOptionLabel={(option: any) => (typeof option === 'string' ? option : option.label)}
            />
          )}
        />
        {formState?.errors?.rel_dir_to_models && (
          <FormHelperText error>Model directory is required</FormHelperText>
        )}
        <Box sx={{ m: 2 }} />
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
          <Button variant="contained" type="submit" data-testid="savebutton" fullWidth>
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateTableForm;

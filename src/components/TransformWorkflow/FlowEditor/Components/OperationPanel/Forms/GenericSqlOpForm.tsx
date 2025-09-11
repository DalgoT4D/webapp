import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, FormLabel } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Controller, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import { useOpForm } from '@/customHooks/useOpForm';

interface GenericDataConfig {
  columns: string[];
  source_columns: string[];
  sql_statement_1: string;
  other_inputs: any[];
  sql_statement_2: string;
}

const GenericSqlOpForm = ({
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
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      sql_statement_1: '',
      sql_statement_2: '',
    },
  });
  let inputName = '';
  if (node?.type === SRC_MODEL_NODE) {
    inputName = nodeData.input_name;
  } else if (node?.type === OPERATION_NODE && nodeData.config.input_models.length > 0) {
    inputName = nodeData.config.input_models[0].name;
  } else {
    inputName = 'undefined';
  }

  const handleSave = async (data: any) => {
    const finalNode = node?.data.isDummy ? parentNode : node; //change  //this checks for edit case too.
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      const postData: any = {
        op_type: operation.slug,
        other_inputs: [],
        config: {
          sql_statement_1: data.sql_statement_1,
          sql_statement_2: data.sql_statement_2,
        },
        input_uuid: finalNode?.type === SRC_MODEL_NODE ? finalNode?.id : '',
        target_model_uuid: finalNode?.data.target_model_id || '',
      };

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

      const { sql_statement_2, sql_statement_1 }: GenericDataConfig = opConfig;

      // pre-fill form
      reset({
        sql_statement_1: sql_statement_1,
        sql_statement_2: sql_statement_2,
      });
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
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box sx={{ padding: '32px 16px 0px 16px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormLabel sx={{ mr: 1, color: 'black' }}>SELECT</FormLabel>
            <Box sx={{ display: 'inline-block' }}>
              <InfoTooltip title={'Output if all values in a row are null'} />
            </Box>
          </Box>
          <Controller
            control={control}
            rules={{ required: 'SQL statement is required' }}
            name="sql_statement_1"
            render={({ field, fieldState }) => (
              <Input
                multiline
                rows={4}
                {...field}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label=""
                sx={{ padding: '0' }}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Controller
            control={control}
            name="sql_statement_2"
            render={({ field, fieldState }) => (
              <Input
                multiline
                rows={4}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                {...field}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label={`FROM ${inputName}`}
                sx={{ padding: '0' }}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
            <Button
              disabled={action === 'view'}
              variant="contained"
              type="submit"
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

export default GenericSqlOpForm;

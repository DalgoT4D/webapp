import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, FormLabel } from '@mui/material';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { Controller, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  DbtModelResponse,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

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
  const [inputModels, setInputModels] = useState<DbtModelResponse[]>([]);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      sql_statement_1: '',
      sql_statement_2: '',
    },
  });

  let inputName = '';
  if (inputModels.length > 0) {
    inputName = inputModels[0].name;
  } else {
    inputName = 'chained';
  }

  const handleSave = async (data: any) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      const opConfig: any = {
        sql_statement_1: data.sql_statement_1,
        sql_statement_2: data.sql_statement_2,
      };

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        const payloadData: CreateOperationNodePayload = {
          op_type: operation.slug,
          other_inputs: [],
          config: opConfig,
          input_node_uuid: finalNode?.id || '',
          source_columns: [],
        };
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          payloadData
        );
      } else if (finalAction === 'edit') {
        const payloadData: EditOperationNodePayload = {
          op_type: operation.slug,
          other_inputs: [],
          config: opConfig,
          source_columns: [],
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
      const nodeResponseData: CanvasNodeDataResponse = await httpGet(
        session,
        `transform/v2/dbt_project/nodes/${node?.id}/`
      );
      const { operation_config, input_nodes } = nodeResponseData;
      setInputModels(
        input_nodes
          ?.map((input) => input.dbtmodel)
          .filter((model): model is DbtModelResponse => model !== undefined) || []
      );

      const { sql_statement_2, sql_statement_1 }: GenericDataConfig = operation_config.config;

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

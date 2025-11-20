import React, { useEffect, useRef, useState } from 'react';
import { Edge, useReactFlow } from 'reactflow';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { generateDummySrcModelNode } from '../../dummynodes';
import { OperationFormProps } from '../../OperationConfigLayout';

import { useSession } from 'next-auth/react';
import { Controller, useForm } from 'react-hook-form';
import { Box, Button } from '@mui/material';

import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import {
  CanvasNodeDataResponse,
  CanvasNodeTypeEnum,
  CreateOperationNodePayload,
  DbtModelResponse,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

export interface SecondaryInput {
  input: { input_name: string; input_type: string; source_name: string };
  seq: number;
  source_columns: string[];
}

interface JoinDataConfig {
  join_type: 'left' | 'inner' | 'full outer';
  join_on: { key1: string; key2: string; compare_with: string };
  other_inputs: SecondaryInput[];
  source_columns: string[];
}

const JoinOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  dummyNodeId,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [nodeSrcColumns, setNodeSrcColumns] = useState<string[]>([]);
  const [table2Columns, setTable2Columns] = useState<string[]>([]);
  const [sourcesModels, setSourcesModels] = useState<DbtModelResponse[]>([]);
  const modelDummyNodeIds: any = useRef<string[]>([]); // array of dummy node ids being attached to current operation node
  const { deleteElements, addEdges, addNodes, getEdges, getNodes } = useReactFlow();

  type FormProps = {
    table1: {
      tab: { id: string; label: string };
      key: string;
    };
    table2: {
      tab: { id: string; label: string };
      key: string;
    };
    join_type: string;
  };

  const { control, handleSubmit, reset, setValue } = useForm<FormProps>({
    defaultValues: {
      table1: {
        tab: { id: '', label: '' },
        key: '',
      },
      table2: {
        tab: { id: '', label: '' },
        key: '',
      },
      join_type: '',
    },
  });
  // Include this for multi-row input

  const fetchSourcesModels = async () => {
    try {
      const response: DbtModelResponse[] = await httpGet(
        session,
        'transform/v2/dbt_project/sources_models/'
      );
      setSourcesModels(response);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAndSetSourceColumns = async () => {
    setNodeSrcColumns(node?.data.output_columns || []);
  };

  const clearAndAddDummyModelNode = (model: DbtModelResponse | undefined | null) => {
    const edges: Edge[] = getEdges();

    const removeNodeId = modelDummyNodeIds.current.pop();

    // pop the last element
    if (removeNodeId) {
      if (
        edges.filter((edge: Edge) => edge.source === removeNodeId || edge.target === removeNodeId)
          .length <= 1
      )
        deleteElements({ nodes: [{ id: removeNodeId }] });
      else {
        // if removeNodeId has multiple edges, the remove the dummy one we just created
        const removeEdges: Edge[] = edges.filter(
          (edge: Edge) => edge.source === removeNodeId && edge.target === dummyNodeId
        );
        deleteElements({
          edges: removeEdges.map((edge: Edge) => ({ id: edge.id })),
        });
      }
    }

    // push the new one
    if (model) {
      let dummySourceNodeData: any = getNodes().find((node) => node.id === model.uuid);

      if (!dummySourceNodeData) {
        dummySourceNodeData = generateDummySrcModelNode(node, model, 400);
        addNodes([dummySourceNodeData]);
      }
      const newEdge: any = {
        id: `${dummySourceNodeData.id}_${dummyNodeId}`,
        source: dummySourceNodeData.id,
        target: dummyNodeId,
        sourceHandle: null,
        targetHandle: null,
      };
      addEdges([newEdge]);
      modelDummyNodeIds.current.push(dummySourceNodeData.id);
    }
  };

  const handleSelectSecondTable = async (id: string | null) => {
    const model: DbtModelResponse | null | undefined = sourcesModels.find(
      (model: DbtModelResponse) => model.uuid === id
    );
    // clear the key of second table also
    setValue('table2.key', '');

    if (model) {
      try {
        const data: Array<string> = model.output_cols;
        setTable2Columns(data.sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.log(error);
      }
    }
    clearAndAddDummyModelNode(model);
  };

  const handleSave = async (data: FormProps) => {
    const finalNode = node;
    const finalAction = node?.data.isDummy ? 'create' : action;
    try {
      const opConfig: any = {
        join_type: data.join_type === 'right' ? 'left' : data.join_type,
        join_on: {
          key1: data.table1.key,
          key2: data.table2.key,
          compare_with: '=',
        },
      };
      const other_inputs = [
        {
          input_model_uuid: data.table2.tab.id,
          columns: table2Columns,
          seq: data.join_type === 'right' ? 0 : 2,
        },
      ];

      // api call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        const payloadData: CreateOperationNodePayload = {
          op_type: operation.slug,
          input_node_uuid: data.table1.tab.id,
          source_columns: nodeSrcColumns,
          other_inputs: other_inputs,
          config: opConfig,
        };
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          payloadData
        );
      } else if (finalAction === 'edit') {
        const payloadData: EditOperationNodePayload = {
          op_type: operation.slug,
          source_columns: nodeSrcColumns,
          other_inputs: other_inputs,
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
      const nodeResponseData: CanvasNodeDataResponse = await httpGet(
        session,
        `transform/v2/dbt_project/nodes/${node?.id}/`
      );
      const { operation_config, input_nodes } = nodeResponseData;

      // form data; will differ based on operations in progress
      const { source_columns, join_on, join_type }: JoinDataConfig = operation_config.config;
      setNodeSrcColumns(source_columns);

      // pre-fill form
      if (input_nodes) {
        let jointype: string = join_type;
        const lengthInputModels: number = input_nodes.length;

        if (lengthInputModels === 1) {
          jointype = input_nodes[0].seq === 0 && jointype === 'left' ? 'right' : jointype;
          setTable2Columns(input_nodes[0].dbtmodel?.output_cols || []);
        }

        reset({
          table1: {
            tab:
              input_nodes.length === 2
                ? { id: input_nodes[0].dbtmodel?.uuid, label: input_nodes[0].dbtmodel?.name }
                : { id: '', label: 'Chained Model' },
            key: join_on.key1,
          },
          table2: {
            tab:
              input_nodes.length >= 1
                ? {
                    id: input_nodes[lengthInputModels - 1].dbtmodel?.uuid,
                    label: input_nodes[lengthInputModels - 1].dbtmodel?.name,
                  }
                : { id: '', label: '' },
            key: join_on.key2,
          },
          join_type: jointype,
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
    fetchSourcesModels();
    if (['edit', 'view'].includes(action)) {
      // do things when in edit state
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
      setValue('table1.tab', {
        id: node?.data?.dbtmodel?.uuid || '',
        label: [CanvasNodeTypeEnum.Source.toString(), CanvasNodeTypeEnum.Model.toString()].includes(
          node?.data?.node_type || ''
        )
          ? node?.data?.dbtmodel?.name || ''
          : 'Chained Model',
      });
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Controller
          control={control}
          name="table1.tab"
          rules={{ required: 'First table is required' }}
          render={({ field, fieldState }) => (
            <Autocomplete
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fieldStyle="transformation"
              isOptionEqualToValue={(option: any, value: any) => {
                return option?.id === value?.id;
              }}
              options={sourcesModels
                .map((model) => {
                  return {
                    id: model.uuid,
                    label: model.name,
                    schema: model.schema,
                  };
                })
                .sort((a, b) => a.label.localeCompare(b.label))}
              disabled={true}
              label="Select the first table*"
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name={`table1.key`}
          rules={{ required: 'Key column is required' }}
          render={({ field, fieldState }) => (
            <Autocomplete
              {...field}
              data-testid="table1key"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              disabled={action === 'view'}
              fieldStyle="transformation"
              options={nodeSrcColumns}
              label="Select key column*"
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          rules={{
            validate: (value) => (value && value?.id !== '') || 'Second table is required',
          }}
          name={`table2.tab`}
          render={({ field, fieldState }) => {
            return (
              <Autocomplete
                {...field}
                data-testid="table2"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fieldStyle="transformation"
                disabled={action === 'view'}
                isOptionEqualToValue={(option: any, value: any) => {
                  return option?.id === value?.id;
                }}
                renderGroup={(params) => (
                  <li key={params.key}>
                    <Box
                      sx={{
                        fontWeight: 600,
                        position: 'sticky',
                        top: '-8px',
                        padding: '4px 10px',
                        background: 'white',
                      }}
                    >
                      {params.group}
                    </Box>
                    <Box>{params.children}</Box>
                  </li>
                )}
                groupBy={(option: any) => option.schema}
                options={sourcesModels
                  .map((model) => {
                    return {
                      id: model.uuid,
                      label: model.name,
                      schema: model.schema,
                    };
                  })
                  .sort((a, b) => a.label.localeCompare(b.label))}
                onChange={(data: any) => {
                  field.onChange(data);
                  handleSelectSecondTable(data?.id ? data.id : null);
                }}
                label="Select the second table*"
              />
            );
          }}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name={`table2.key`}
          rules={{ required: 'Key column is required' }}
          render={({ field, fieldState }) => (
            <Autocomplete
              {...field}
              data-testid="table2key"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fieldStyle="transformation"
              disabled={action === 'view'}
              options={table2Columns}
              label="Select key column*"
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          rules={{ required: 'Join type is required' }}
          control={control}
          name="join_type"
          render={({ field, fieldState }) => (
            <Autocomplete
              {...field}
              data-testid="joinType"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fieldStyle="transformation"
              disabled={action === 'view'}
              options={['left', 'right', 'inner', 'full outer']}
              label="Select the join type*"
            />
          )}
        />

        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
          <Button
            disabled={action === 'view'}
            variant="contained"
            type="submit"
            data-testid="savebutton"
            fullWidth
            sx={{ marginTop: '24px' }}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default JoinOpForm;

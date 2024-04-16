import React, { useEffect, useRef, useState } from 'react';

import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { OperationFormProps } from '../../OperationConfigLayout';
import { DbtSourceModel, OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Controller, useForm } from 'react-hook-form';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Box, Button } from '@mui/material';
import { Edge, useReactFlow } from 'reactflow';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { generateDummySrcModelNode } from '../../dummynodes';

export interface SecondaryInput {
  input: { input_name: string; input_type: string; source_name: string };
  seq: number;
  source_columns: string[];
}

interface JoinDataConfig {
  join_type: 'left' | 'inner';
  join_on: { key1: string; key2: string; compare_with: string };
  other_inputs: SecondaryInput[];
  source_columns: string[];
}

const JoinOpForm = ({
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
  const [nodeSrcColumns, setNodeSrcColumns] = useState<string[]>([]);
  const [table2Columns, setTable2Columns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);

  const modelDummyNodeIds: any = useRef<string[]>([]); // array of dummy node ids being attached to current operation node
  const { deleteElements, addEdges, addNodes, getEdges, getNodes } =
    useReactFlow();
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

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
      const response: DbtSourceModel[] = await httpGet(
        session,
        'transform/dbt_project/sources_models/'
      );
      setSourcesModels(response);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchWareohuseTableColumns = async (
    schema: string,
    input_name: string
  ) => {
    try {
      const data: ColumnData[] = await httpGet(
        session,
        `warehouse/table_columns/${schema}/${input_name}`
      );
      return data.map((col: ColumnData) => col.name);
    } catch (error) {
      console.log(error);
    }
    return [];
  };

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: Array<string> = await fetchWareohuseTableColumns(
          nodeData?.schema,
          nodeData?.input_name
        );
        setNodeSrcColumns(data.sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setNodeSrcColumns(nodeData.output_cols);
    }
  };

  const clearAndAddDummyModelNode = (
    model: DbtSourceModel | undefined | null
  ) => {
    const edges: Edge[] = getEdges();

    const removeNodeId = modelDummyNodeIds.current.pop();

    // pop the last element
    if (removeNodeId) {
      if (
        edges.filter(
          (edge: Edge) =>
            edge.source === removeNodeId || edge.target === removeNodeId
        ).length <= 1
      )
        deleteElements({ nodes: [{ id: removeNodeId }] });
      else {
        // if removeNodeId has multiple edges, the remove the dummy one we just created
        const removeEdges: Edge[] = edges.filter(
          (edge: Edge) =>
            edge.source === removeNodeId && edge.target === dummyNodeId
        );
        deleteElements({
          edges: removeEdges.map((edge: Edge) => ({ id: edge.id })),
        });
      }
    }

    // push the new one
    if (model) {
      let dummySourceNodeData: any = getNodes().find(
        (node) => node.id === model.id
      );

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
    const model: DbtSourceModel | null | undefined = sourcesModels.find(
      (model: DbtSourceModel) => model.id === id
    );
    // clear the key of second table also
    setValue('table2.key', '');

    if (model) {
      try {
        const data: Array<string> = await fetchWareohuseTableColumns(
          model.schema,
          model.input_name
        );
        setTable2Columns(data.sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.log(error);
      }
    }
    clearAndAddDummyModelNode(model);
  };

  const handleSave = async (data: FormProps) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        input_uuid: data.table1.tab.id,
        source_columns: nodeSrcColumns,
        other_inputs: [
          {
            uuid: data.table2.tab.id,
            columns: table2Columns,
            seq: data.join_type === 'right' ? 0 : 2,
          },
        ],
        config: {
          join_type: data.join_type === 'right' ? 'left' : data.join_type,
          join_on: {
            key1: data.table1.key,
            key2: data.table2.key,
            compare_with: '=',
          },
        },
        target_model_uuid: nodeData?.target_model_id || '',
      };
      // api call
      setLoading(true);
      let operationNode: any;
      if (action === 'create') {
        operationNode = await httpPost(
          session,
          `transform/dbt_project/model/`,
          postData
        );
      } else if (action === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid
            ? inputModels[0].uuid
            : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${node?.id}/`,
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
      const {
        source_columns,
        join_on,
        join_type,
        other_inputs,
      }: JoinDataConfig = opConfig;
      setNodeSrcColumns(source_columns);

      // pre-fill form
      const lengthInputModels: number = input_models.length;
      let jointype: string = join_type;
      if (other_inputs.length === 1) {
        jointype =
          other_inputs[0].seq === 0 && jointype == 'left' ? 'right' : jointype;
        setTable2Columns(other_inputs[0].source_columns);
      }
      reset({
        table1: {
          tab:
            input_models.length == 2
              ? { id: input_models[0].uuid, label: input_models[0].name }
              : { id: '', label: 'Chained Model' },
          key: join_on.key1,
        },
        table2: {
          tab:
            input_models.length >= 1
              ? {
                  id: input_models[lengthInputModels - 1].uuid,
                  label: input_models[lengthInputModels - 1].name,
                }
              : { id: '', label: '' },
          key: join_on.key2,
        },
        join_type: jointype,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourcesModels();
    if (['edit', 'view'].includes(action)) {
      // do things when in edit state
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
      setValue('table1.tab', {
        id: nodeData?.id,
        label:
          nodeData?.type === SRC_MODEL_NODE
            ? nodeData?.input_name
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
                    id: model.id,
                    label: model.input_name,
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
            validate: (value) =>
              (value && value?.id !== '') || 'Second table is required',
          }}
          name={`table2.tab`}
          render={({ field, fieldState }) => {
            return (
              <Autocomplete
                {...field}
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
                      id: model.id,
                      label: model.input_name,
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
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fieldStyle="transformation"
              disabled={action === 'view'}
              options={['left', 'right', 'inner']}
              label="Select the join type*"
            />
          )}
        />

        <Box>
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

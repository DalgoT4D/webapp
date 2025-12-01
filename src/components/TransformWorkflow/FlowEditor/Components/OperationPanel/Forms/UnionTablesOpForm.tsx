import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Edge, useReactFlow } from 'reactflow';
import InfoBox from '@/components/TransformWorkflow/FlowEditor/Components/InfoBox';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { generateDummySrcModelNode } from '../../dummynodes';
import { SecondaryInput } from './JoinOpForm';
import {
  CanvasNodeDataResponse,
  CreateOperationNodePayload,
  DbtModelResponse,
  EditOperationNodePayload,
} from '@/types/transform-v2.types';

interface UnionDataConfig {
  other_inputs: SecondaryInput[];
  source_columns: string[];
}

const UnionTablesOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  dummyNodeId,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [sourcesModels, setSourcesModels] = useState<DbtModelResponse[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [nodeSrcColumns, setNodeSrcColumns] = useState<string[]>([]);
  const { deleteElements, addEdges, addNodes, getEdges, getNodes } = useReactFlow();
  const modelDummyNodeIds: any = useRef<string[]>([]); // array of dummy node ids being attached to current operation node

  const { control, handleSubmit, reset, setValue } = useForm<{
    tables: Array<{ id: string; label: string }>;
  }>({
    defaultValues: {
      tables: [
        { id: '', label: '' },
        { id: '', label: '' },
      ],
    },
  });

  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({ control, name: 'tables' });

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

  const fetchWarehouseTableColumns = async (schema: string, input_name: string) => {
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
    if (node) {
      setNodeSrcColumns(node.data.output_columns);
    }
  };

  const clearAndAddDummyModelNode = (model: DbtModelResponse | undefined | null, index: number) => {
    index = index - 1;
    let currentModelDummyNodeIds = modelDummyNodeIds.current;
    const edges: Edge[] = getEdges();

    // make sure the arry is of correct length
    if (currentModelDummyNodeIds.length < index + 1) {
      currentModelDummyNodeIds = currentModelDummyNodeIds.concat(
        Array(index + 1 - currentModelDummyNodeIds.length).fill(null)
      );
    }

    if (currentModelDummyNodeIds[index]) {
      // remove edges to this dummy node
      const removeEdges: Edge[] = edges.filter(
        (edge: Edge) =>
          edge.source === currentModelDummyNodeIds[index] && edge.target === dummyNodeId
      );

      // remove the node if it has exactly one dummy edge
      let removeNode = false;
      if (
        edges.filter(
          (edge: Edge) =>
            edge.source == currentModelDummyNodeIds[index] && edge.target == dummyNodeId
        ).length === 1 &&
        edges.filter(
          (edge: Edge) =>
            edge.source == currentModelDummyNodeIds[index] ||
            edge.target == currentModelDummyNodeIds[index]
        ).length === 1
      )
        removeNode = true;

      deleteElements({
        nodes: removeNode ? [{ id: currentModelDummyNodeIds[index] }] : [],
        edges: removeEdges.map((edge: Edge) => ({ id: edge.id })),
      });
      currentModelDummyNodeIds[index] = null;
    }

    // create and update the new dummy node at same index
    if (model) {
      let dummySourceNodeData: any = getNodes().find((node) => node.id === model.uuid);

      if (!dummySourceNodeData) {
        // create a new dummy node if its not on the canvas
        dummySourceNodeData = generateDummySrcModelNode(node, model, 400 * (index + 1));
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
      currentModelDummyNodeIds[index] = dummySourceNodeData.id;
    }

    modelDummyNodeIds.current = currentModelDummyNodeIds;
  };

  const handleSave = async (data: { tables: { id: string; label: string }[] }) => {
    if (data.tables.length < 2) {
      errorToast('Please select atleast two tables to union', [], globalContext);
      return;
    }

    try {
      const otherInputPromises = data.tables.slice(1).map(async (table: any, index: number) => {
        const srcModel = sourcesModels.find((model: DbtModelResponse) => model.uuid === table.id);
        let srcColumns: string[] = [];

        if (srcModel) {
          srcColumns = await fetchWarehouseTableColumns(srcModel.schema, srcModel.name);
        }
        return {
          input_model_uuid: table.id,
          columns: srcColumns,
          seq: index + 2, // 1 is for the current node input
        };
      });

      const otherInputs = await Promise.all(otherInputPromises);

      // api call
      setLoading(true);
      let operationNode: any;
      if (action === 'create') {
        const payloadData: CreateOperationNodePayload = {
          op_type: operation.slug,
          input_node_uuid: node?.id || '',
          source_columns: nodeSrcColumns,
          other_inputs: otherInputs,
          config: {},
        };
        operationNode = await httpPost(
          session,
          `transform/v2/dbt_project/operations/nodes/`,
          payloadData
        );
      } else if (action === 'edit') {
        const payloadData: EditOperationNodePayload = {
          op_type: operation.slug,
          source_columns: nodeSrcColumns,
          other_inputs: otherInputs,
          config: {},
        };
        operationNode = await httpPut(
          session,
          `transform/v2/dbt_project/operations/nodes/${node?.id}/`,
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
      const { source_columns }: UnionDataConfig = operation_config.config;
      setNodeSrcColumns(source_columns);

      // pre-fill form
      reset({
        tables:
          input_nodes
            ?.map((node: CanvasNodeDataResponse) => node.dbtmodel)
            .filter((model): model is DbtModelResponse => model != null)
            .map((model: DbtModelResponse) => ({
              id: model.uuid,
              label: model.name,
            })) ?? [],
      });
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
      setValue(`tables.${0}`, {
        id: node?.data.dbtmodel?.uuid || '',
        label: node?.data.dbtmodel?.name || '',
      });
    }
  }, [session, node]);

  console.log('current node', node);

  return (
    <Box sx={{ ...sx, padding: '0px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        {fields.map((field, index) => (
          <Box key={field.id} sx={{ mt: '17px' }}>
            <Controller
              key={`${field.id}_${index}`}
              control={control}
              rules={{
                validate: (value) => (value && value.id !== '') || `Table ${index + 1} is required`,
              }}
              name={`tables.${index}`}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  data-testid={`table${index}`}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  key={`${index}`}
                  disabled={index === 0}
                  options={sourcesModels
                    .map((model: DbtModelResponse) => ({
                      id: model.uuid,
                      label: model.name,
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label))}
                  isOptionEqualToValue={(option: any, value: any) => {
                    return option?.id === value?.id;
                  }}
                  onChange={(data: any) => {
                    field.onChange(data);
                    const model: DbtModelResponse | undefined = sourcesModels.find(
                      (model: DbtModelResponse) => model.uuid === data?.id
                    );
                    clearAndAddDummyModelNode(model, index);
                  }}
                  label={`Select the table no ${index + 1}*`}
                  fieldStyle="transformation"
                />
              )}
            />
            {index === fields.length - 1 ? (
              <Button
                variant="outlined"
                type="button"
                data-testid="addoperand"
                sx={{ marginTop: '17px' }}
                onClick={(event) => append({ id: '', label: '' })}
              >
                Add Table
              </Button>
            ) : index < fields.length - 1 && index > 0 ? (
              <Button
                variant="outlined"
                type="button"
                data-testid="removeoperand"
                sx={{ marginTop: '17px' }}
                onClick={(event) => {
                  remove(index);
                  clearAndAddDummyModelNode(null, index);
                }}
              >
                Remove
              </Button>
            ) : (
              ''
            )}
          </Box>
        ))}
        <InfoBox text="Columns not belonging to both tables will yield NULLs in the union" />
        <Box sx={{ m: 2 }} />
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', pb: 2 }}>
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

export default UnionTablesOpForm;

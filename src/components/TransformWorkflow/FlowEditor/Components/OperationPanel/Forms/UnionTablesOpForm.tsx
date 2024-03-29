import React, { useContext, useEffect, useRef, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
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

interface UnionDataConfig {
  other_inputs: SecondaryInput[];
  source_columns: string[];
}

const UnionTablesOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
  action,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [nodeSrcColumns, setNodeSrcColumns] = useState<string[]>([]);
  const { deleteElements, addEdges, addNodes, getEdges, getNodes } =
    useReactFlow();
  const modelDummyNodeIds: any = useRef<string[]>([]); // array of dummy node ids being attached to current operation node
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

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
        setNodeSrcColumns(data);
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setNodeSrcColumns(nodeData.output_cols);
    }
  };

  const clearAndAddDummyModelNode = (
    model: DbtSourceModel | undefined | null,
    index: number
  ) => {
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
          edge.source === currentModelDummyNodeIds[index] &&
          edge.target === dummyNodeId
      );

      // remove the node if it has exactly one dummy edge
      let removeNode = false;
      if (
        edges.filter(
          (edge: Edge) =>
            edge.source == currentModelDummyNodeIds[index] &&
            edge.target == dummyNodeId
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
      let dummySourceNodeData: any = getNodes().find(
        (node) => node.id === model.id
      );

      if (!dummySourceNodeData) {
        // create a new dummy node if its not on the canvas
        dummySourceNodeData = generateDummySrcModelNode(
          node,
          model,
          400 * (index + 1)
        );
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

  const handleSave = async (data: {
    tables: { id: string; label: string }[];
  }) => {
    if (data.tables.length < 2) {
      errorToast(
        'Please select atleast two tables to union',
        [],
        globalContext
      );
      return;
    }

    const otherInputPromises = data.tables
      .slice(1)
      .map(async (table: any, index: number) => {
        const srcModel = sourcesModels.find(
          (model: DbtSourceModel) => model.id === table.id
        );
        let srcColumns: string[] = [];

        if (srcModel) {
          srcColumns = await fetchWareohuseTableColumns(
            srcModel.schema,
            srcModel.input_name
          );
        }
        return {
          uuid: table.id,
          columns: srcColumns,
          seq: index,
        };
      });

    try {
      const postData: any = {
        op_type: operation.slug,
        input_uuid: data.tables[0].id,
        source_columns: nodeSrcColumns,
        other_inputs: await Promise.all(otherInputPromises),
        config: {},
        target_model_uuid: nodeData?.target_model_id || '',
      };

      // api call
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
    }
  };

  const fetchAndSetConfigForEdit = async () => {
    try {
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      let { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      let { source_columns }: UnionDataConfig = opConfig;
      setNodeSrcColumns(source_columns);

      // pre-fill form
      reset({
        tables: input_models.map((model: any) => ({
          id: model.uuid,
          label: model.name,
        })),
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSourcesModels();
    if (['edit', 'view'].includes(action)) {
      // do things when in edit state
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
      setValue(`tables.${0}`, {
        id: nodeData?.id || '',
        label: nodeData?.input_name,
      });
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx, padding: '0px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        {fields.map((field, index) => (
          <Box key={field.id} sx={{ mt: '17px' }}>
            <Controller
              key={`${field.id}_${index}`}
              control={control}
              name={`tables.${index}`}
              render={({ field }) => (
                <Autocomplete
                  key={`${index}`}
                  disabled={index === 0}
                  options={sourcesModels
                    .map((model: DbtSourceModel) => ({
                      id: model.id,
                      label: model.input_name,
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label))}
                  isOptionEqualToValue={(option: any, value: any) => {
                    return option?.id === value?.id;
                  }}
                  value={field.value}
                  onChange={(e, data: any) => {
                    field.onChange(data);
                    const model: DbtSourceModel | undefined =
                      sourcesModels.find(
                        (model: DbtSourceModel) => model.id === data?.id
                      );
                    clearAndAddDummyModelNode(model, index);
                  }}
                  label={`Select the table no ${index + 1}`}
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
        <Box>
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
        <InfoBox text="Columns not belonging to both tables will yield NULLs in the union" />
      </form>
    </Box>
  );
};

export default UnionTablesOpForm;

import React, { useContext, useEffect, useRef, useState } from 'react';

import { httpGet, httpPost } from '@/helpers/http';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { OperationFormProps } from '../../OperationConfigLayout';
import { DbtSourceModel, OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { Controller, useForm } from 'react-hook-form';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { Autocomplete, Box, Button, Grid, Typography } from '@mui/material';
import Input from '@/components/UI/Input/Input';
import { Edge, useReactFlow } from 'reactflow';

const JoinOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [nodeSrcColumns, setNodeSrcColumns] = useState<string[]>([]);
  const [table2Columns, setTable2Columns] = useState<string[]>([]);
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const globalContext = useContext(GlobalContext);
  const modelDummyNodeId: any = useRef('');
  const { deleteElements, addEdges, addNodes, getEdges } = useReactFlow();
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      table1: {
        uuid: '',
        key: '',
      },
      table2: {
        uuid: '',
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
        setNodeSrcColumns(data);
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setNodeSrcColumns(nodeData.output_cols);
    }
  };

  const clearAndAddDummyModelNode = (model: DbtSourceModel) => {
    const edges: Edge[] = getEdges();
    if (
      modelDummyNodeId.current &&
      edges.filter(
        (edge: Edge) =>
          edge.source === modelDummyNodeId.current ||
          edge.target === modelDummyNodeId.current
      ).length <= 1
    ) {
      deleteElements({ nodes: [{ id: modelDummyNodeId.current }] });
    }

    const dummySourceNodeData: any = {
      id: model.id,
      type: SRC_MODEL_NODE,
      data: model,
      position: {
        x: node ? node?.xPos + 150 : 100,
        y: node?.yPos,
      },
    };
    const newEdge: any = {
      id: `${dummySourceNodeData.id}_${dummyNodeId}`,
      source: dummySourceNodeData.id,
      target: dummyNodeId,
      sourceHandle: null,
      targetHandle: null,
    };
    addNodes([dummySourceNodeData]);
    addEdges([newEdge]);
    modelDummyNodeId.current = model.id;
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
        setTable2Columns(data);
      } catch (error) {
        console.log(error);
      }
      clearAndAddDummyModelNode(model);
    }
  };

  const handleSave = async (data: any) => {
    console.log('data', data);
    console.log('options', {
      id: nodeData?.type === SRC_MODEL_NODE ? nodeData?.id : '',
      label: 'Target Model',
    });
    try {
      const postData: any = {
        op_type: operation.slug,
        input_uuid: data.table1.uuid,
        source_columns: nodeSrcColumns,
        other_inputs: [
          {
            uuid: data.table2.uuid,
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
      const operationNode: any = await httpPost(
        session,
        `transform/dbt_project/model/`,
        postData
      );
      continueOperationChain(operationNode);
      reset();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAndSetSourceColumns();
    fetchSourcesModels();
    if (nodeData?.type === SRC_MODEL_NODE) {
      setValue('table1.uuid', nodeData?.id || '');
    }
  }, [session]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Controller
          control={control}
          name={`table1.uuid`}
          render={({ field }) => (
            <Autocomplete
              options={[
                {
                  label:
                    nodeData?.type === SRC_MODEL_NODE
                      ? nodeData?.input_name
                      : 'Target Model',
                  id: nodeData?.id,
                },
              ].map((option) => option.label)}
              disabled={true}
              defaultValue={
                nodeData?.type === SRC_MODEL_NODE
                  ? nodeData?.input_name
                  : 'Target Model'
              }
              onChange={(e, data) => {
                field.onChange(data?.id);
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  sx={{ width: '100%' }}
                  label="Select the first table"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name={`table1.key`}
          render={({ field }) => (
            <Autocomplete
              options={nodeSrcColumns}
              value={field.value}
              onChange={(e, data) => {
                field.onChange(data);
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  sx={{ width: '100%' }}
                  label="Select the column"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name={`table2.uuid`}
          render={({ field }) => (
            <Autocomplete
              options={sourcesModels.map((model) => {
                return {
                  id: model.id,
                  label: model.input_name,
                };
              })}
              onChange={(e, data) => {
                field.onChange(data ? data.id : null);
                handleSelectSecondTable(data ? data.id : null);
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  sx={{ width: '100%' }}
                  label="Select the second table"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name={`table2.key`}
          render={({ field }) => (
            <Autocomplete
              options={table2Columns}
              value={field.value}
              onChange={(e, data) => {
                field.onChange(data);
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  sx={{ width: '100%' }}
                  label="Select the column"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <Controller
          control={control}
          name="join_type"
          render={({ field }) => (
            <Autocomplete
              options={['left', 'right', 'inner']}
              value={field.value}
              onChange={(e, data) => {
                field.onChange(data);
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  sx={{ width: '100%' }}
                  label="Select the join type"
                />
              )}
            />
          )}
        />

        <Box>
          <Button
            variant="outlined"
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
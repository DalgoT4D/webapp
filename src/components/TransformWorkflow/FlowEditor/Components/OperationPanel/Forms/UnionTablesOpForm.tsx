import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { useReactFlow } from 'reactflow';
import InfoBox from '@/components/TransformWorkflow/FlowEditor/Components/InfoBox';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';

const UnionTablesOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const [nodeSrcColumns, setNodeSrcColumns] = useState<string[]>([]);
  const { deleteElements, addEdges, addNodes } = useReactFlow();
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

  const addDummyNodeAndEdge = (model: DbtSourceModel) => {
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
  };

  const removeDummyNodeAndEdge = (nodeId: string) => {
    deleteElements({ nodes: [{ id: nodeId }] });
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
      setValue(`tables.${0}`, {
        id: nodeData?.id || '',
        label: nodeData?.input_name,
      });
    }
  }, [session]);

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
                  onChange={(e, data) => {
                    // remove dummy node if present
                    if (!data) {
                      removeDummyNodeAndEdge(field.value?.id);
                    }
                    field.onChange(data);
                    // add dummy node
                    if (data?.id) {
                      const model: DbtSourceModel | undefined =
                        sourcesModels.find(
                          (model: DbtSourceModel) => model.id === data?.id
                        );
                      if (model) addDummyNodeAndEdge(model);
                    }
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
                onClick={(event) => remove(index)}
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

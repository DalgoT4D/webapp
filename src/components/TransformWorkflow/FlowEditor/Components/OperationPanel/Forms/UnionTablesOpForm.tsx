import React, { useContext, useEffect, useRef, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  SxProps,
  TextField,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Edge, useReactFlow } from 'reactflow';

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
  const { deleteElements, addEdges, addNodes, getEdges } = useReactFlow();
  const modelDummyNodeId: any = useRef('');
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, register, handleSubmit, reset, watch, setValue } = useForm<{
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

  const handleSave = async (data: any) => {
    try {
      console.log('saving', data);
      return;
      const output_col_name = data.column_name;

      if (!output_col_name) {
        errorToast('Please select a column', [], globalContext);
      }

      const postData: any = {
        op_type: operation.slug,
        source_columns: srcColumns.filter((col) => col !== output_col_name),
        other_inputs: [],
        config: {
          columns: [
            {
              col_name: output_col_name,
              output_column_name: output_col_name,
              replace_ops: [],
            },
          ],
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };
      data.config.forEach((item: any) => {
        if (item.old && item.new)
          postData.config.columns[0].replace_ops.push({
            find: item.old,
            replace: item.new,
          });
      });

      // validations
      if (Object.keys(postData.config.columns).length === 0) {
        console.log('Please add values to replace');
        errorToast('Please add values to replace', [], globalContext);
        return;
      }

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
    fetchSourcesModels();
    if (nodeData?.type === SRC_MODEL_NODE) {
      setValue(`tables.${0}`, {
        id: nodeData?.id || '',
        label: nodeData?.input_name,
      });
    }
  }, [session]);

  console.log('FIELDS', fields);

  return (
    <Box sx={{ ...sx, padding: '0px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        {fields.map((field, index) => (
          <Box>
            <Controller
              key={`${field.id}_${index}`}
              control={control}
              name={`tables.${index}`}
              render={({ field }) => (
                <Autocomplete
                  key={`${index}`}
                  disabled={index === 0}
                  sx={{ marginTop: '17px' }}
                  options={sourcesModels.map((model: DbtSourceModel) => ({
                    id: model.id,
                    label: model.input_name,
                  }))}
                  isOptionEqualToValue={(option: any, value: any) => {
                    return option?.id === value?.id;
                  }}
                  value={field.value}
                  onChange={(e, data) => {
                    field.onChange(data);
                    const model: DbtSourceModel | undefined =
                      sourcesModels.find(
                        (model: DbtSourceModel) => model.id === data?.id
                      );
                    // if (model) clearAndAddDummyModelNode(model);
                  }}
                  renderInput={(params) => (
                    <Input
                      {...params}
                      sx={{ width: '100%' }}
                      label={`Select the table no ${index + 1}`}
                    />
                  )}
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
            variant="outlined"
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

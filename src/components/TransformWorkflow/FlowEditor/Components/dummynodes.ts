import { UIOperationType } from './Canvas';
import { getNextNodePosition } from '@/utils/editor';
import { CanvasNodeTypeEnum, DbtModelResponse, GenericNode } from '@/types/transform-v2.types';

export const generateDummySrcModelNode = (node: any, model: DbtModelResponse, height = 200) => {
  const nodeId = String(Date.now());
  const { x: xnew, y: ynew } = getNextNodePosition([
    {
      position: { x: node?.xPos, y: node?.yPos },
      height: height,
    },
  ]);

  const dummyNode: any = {
    id: nodeId,
    type:
      model.type === 'source'
        ? CanvasNodeTypeEnum.Source.toString()
        : CanvasNodeTypeEnum.Model.toString(),
    data: {
      name: `${model.schema}.${model.name}`,
      uuid: nodeId,
      node_type:
        model.type === 'source'
          ? CanvasNodeTypeEnum.Source.toString()
          : CanvasNodeTypeEnum.Model.toString(),
      output_columns: model.output_cols,
      operation_config: {},
      isDummy: true,
      dbtmodel: model,
      is_last_in_chain: true,
    },
    position: {
      x: xnew,
      y: ynew,
    },
  };

  // dummyNode.data = { ...model, isDummy: true, parentNode: node };

  return dummyNode;
};

export const generateDummyOperationlNode = (node: any, op: UIOperationType, height = 200) => {
  const nodeId = String(Date.now()); //this is the node.id, that is used to hit backend.
  const { x: xnew, y: ynew } = getNextNodePosition([
    { position: { x: node?.xPos, y: node?.yPos }, height: height },
  ]);

  const dummyTargetNodeData: GenericNode = {
    id: nodeId,
    type: 'operation',
    selected: true,
    data: {
      name: op.label,
      uuid: nodeId,
      node_type: CanvasNodeTypeEnum.Operation,
      output_columns: [],
      operation_config: { type: op.slug, config: {} },
      isDummy: true,
      dbtmodel: null,
      is_last_in_chain: true,
      isPublished: false,
    },
    position: {
      x: xnew,
      y: ynew,
    },
  };
  return dummyTargetNodeData;
};

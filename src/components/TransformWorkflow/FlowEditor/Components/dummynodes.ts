import { DbtSourceModel, UIOperationType } from './Canvas';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../constant';
import { getNextNodePosition } from '@/utils/editor';
import { CanvasNodeRender, CanvasNodeRenderData, GenericNode } from '@/types/transform-v2.types';

export const generateDummySrcModelNode = (node: any, model: DbtSourceModel, height = 200) => {
  const { x: xnew, y: ynew } = getNextNodePosition([
    {
      position: { x: node?.xPos, y: node?.yPos },
      height: height,
    },
  ]);

  const dummyNode: any = {
    id: model.id,
    type: SRC_MODEL_NODE,
    data: {},
    position: {
      x: xnew,
      y: ynew,
    },
  };

  dummyNode.data = { ...model, isDummy: true, parentNode: node };

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
      node_type: 'operation',
      output_columns: [],
      operation_config: { type: op.slug },
      isDummy: true,
      dbtmodel: null,
    },
    position: {
      x: xnew,
      y: ynew,
    },
  };
  return dummyTargetNodeData;
};

import { DbtSourceModel, UIOperationType } from './Canvas';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../constant';
import { getNextNodePosition } from '@/utils/editor';

export const generateDummySrcModelNode = (
  node: any,
  model: DbtSourceModel,
  height = 200
) => {
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

  dummyNode.data = { ...model, isDummy: true };

  return dummyNode;
};

export const generateDummyOperationlNode = (
  node: any,
  op: UIOperationType,
  height = 200
) => {
  const nodeId = String(Date.now());
  const { x: xnew, y: ynew } = getNextNodePosition([
    { position: { x: node?.xPos, y: node?.yPos }, height: height },
  ]);
  const dummyTargetNodeData: any = {
    id: nodeId,
    selected: true,
    type: OPERATION_NODE,
    data: {
      id: nodeId,
      type: OPERATION_NODE,
      output_cols: [],
      target_model_id: '',
      target_model_name: '',
      target_model_schema: '',
      config: { type: op.slug },
      isDummy: true,
    },
    position: {
      x: xnew,
      y: ynew,
    },
  };
  return dummyTargetNodeData;
};

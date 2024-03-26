import { DbtSourceModel, getNextNodePosition } from './Canvas';
import { SRC_MODEL_NODE } from '../constant';

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

  let dummyNode: any = {
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

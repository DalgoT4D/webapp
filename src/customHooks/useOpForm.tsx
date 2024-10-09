import {
  DbtSourceModel,
  OperationNodeData,
} from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import { OperationFormProps } from '@/components/TransformWorkflow/FlowEditor/Components/OperationConfigLayout';
import { OPERATION_NODE, SRC_MODEL_NODE } from '@/components/TransformWorkflow/FlowEditor/constant';

export const useOpForm = ({ props }: { props: OperationFormProps | any }) => {
  //parent node from which dummy node is being created.
  //it can be operational node or source node.

  const { node } = props;
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
        ? (node?.data as OperationNodeData)
        : {};
  const parentNode = node?.data?.parentNode; //parentNode inside Node
  return { nodeData, parentNode };
};

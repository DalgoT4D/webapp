import { OperationFormProps } from '@/components/TransformWorkflow/FlowEditor/Components/OperationConfigLayout';
import { CanvasNodeRenderData } from '@/types/transform-v2.types';

export const useOpForm = ({ props }: { props: OperationFormProps }) => {
  //parent node from which dummy node is being created.
  //it can be operational node or source node.

  const { node } = props;
  const nodeData: CanvasNodeRenderData | null = node ? node.data : null;
  const parentNode = node?.data?.parentNode; //parentNode inside Node
  return { nodeData, parentNode };
};

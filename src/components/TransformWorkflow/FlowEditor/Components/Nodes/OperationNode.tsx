import { Box } from '@mui/material';
import 'react';
import { Handle, Position, useReactFlow, useNodeId } from 'reactflow';
import { OperationNodeType } from '../Canvas';

export function OperationNode(node: OperationNodeType) {
  return (
    <Box>
      {node.data.node.config?.type}
      <>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </>
    </Box>
  );
}

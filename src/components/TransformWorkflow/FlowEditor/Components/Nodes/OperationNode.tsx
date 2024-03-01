import { Box } from '@mui/material';
import 'react';
import { Handle, Position, useReactFlow, useNodeId } from 'reactflow';

export function OperationNode({ data }: any) {
  return (
    <Box>
      {data?.node?.config?.type}
      <>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </>
    </Box>
  );
}

import { Box, Divider, IconButton, Typography } from '@mui/material';
import 'react';
import {
  Handle,
  Position,
  // useReactFlow,
  useNodeId,
  useEdges,
  Edge,
} from 'reactflow';
import { OperationNodeType } from '../Canvas';
import DeleteIcon from '@mui/icons-material/Delete';

export function OperationNode(node: OperationNodeType) {
  const edges = useEdges();
  const nodeId = useNodeId();

  const { data, type } = node;
  // can only this node if it doesn't have anything emanating edge from it i.e. leaf node
  const isDeletable: boolean = edges.find(
    (edge: Edge) => edge.source === nodeId
  )
    ? false
    : true;

  const handleDeleteAction = () => {
    data.triggerDelete(nodeId, type);
  };

  return (
    <Box>
      <>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </>
      <Box
        sx={{
          width: '80px',
          height: '100px',
          background: '#F8F8F8',
          boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.16)',
          borderRadius: '5px 5px 5px 5px',
        }}
      >
        <Box
          sx={{
            padding: '8px',
            height: '70%',
          }}
        >
          <Box
            sx={{
              height: '100%',
              background: '#D9D9D9',
              borderRadius: '4px',
            }}
          >
            {isDeletable && (
              <IconButton
                onClick={handleDeleteAction}
                data-testid="closebutton"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        <Divider orientation="horizontal" sx={{ color: '#EEEEEE' }} />
        <Box>
          <Typography fontWeight="600" fontSize="12px" padding="8px">
            {node.data.node.config?.type}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

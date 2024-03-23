import { Box, Divider, IconButton, Typography } from '@mui/material';
import 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import { OperationNodeType } from '../Canvas';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { operations } from '../../constant';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';

export function OperationNode(node: OperationNodeType) {
  const edges = useEdges();
  const nodeId = useNodeId();
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode, setCanvasNode } = useCanvasNode();

  // can only delete/chain more ops if this node doesn't have anything emanating edge from it i.e. leaf node
  const isDeletable: boolean = edges.find(
    (edge: Edge) => edge.source === nodeId
  )
    ? false
    : true;

  const handleDeleteAction = () => {
    setCanvasAction({
      type: 'delete-node',
      data: { nodeId: nodeId, nodeType: node.type },
    });
  };

  const handleSelectNode = () => {
    if (isDeletable) {
      setCanvasAction({
        type: 'open-opconfig-panel',
        data: null,
      });
    } else {
      // just view the config if its node in the middel of chain
      setCanvasAction({
        type: 'open-opconfig-panel',
        data: 'view',
      });
    }
    setCanvasNode(node);
  };

  return (
    <Box>
      <>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </>
      <Box
        sx={{
          width: '90px',
          height: '100px',
          background: 'white',
          boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.16)',
          borderRadius: '5px 5px 5px 5px',
        }}
      >
        <Box
          sx={{
            padding: '8px',
          }}
        >
          <Box
            sx={{
              height: '48px',
              background: '#F5FAFA',
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
        <Box sx={{ display: 'flex' }} onClick={handleSelectNode}>
          <Box
            sx={{
              flex: '1',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            <Typography
              fontWeight="600"
              fontSize="12px"
              padding="8px"
              sx={{ textAlign: 'center' }}
            >
              {operations.find((op) => op.slug === node.data.config?.type)
                ?.label || 'Not found'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

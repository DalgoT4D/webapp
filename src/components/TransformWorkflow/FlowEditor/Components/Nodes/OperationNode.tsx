import { Box, Divider, IconButton, Typography } from '@mui/material';
import 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import { OperationNodeType } from '../Canvas';
import DeleteIcon from '@mui/icons-material/Delete';
import { OPERATION_NODE, operations } from '../../constant';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';
import { useEffect } from 'react';

export function OperationNode(node: OperationNodeType) {
  const edges = useEdges();
  const nodeId = useNodeId();
  const { setCanvasAction, canvasAction } = useCanvasAction();
  const { setCanvasNode } = useCanvasNode();

  const edgesGoingIntoNode: Edge[] = edges.filter(
    (edge: Edge) => edge.target === nodeId
  );
  const edgesEmanatingOutOfNode: Edge[] = edges.filter(
    (edge: Edge) => edge.source === nodeId
  );

  // can only delete/chain more ops if this node doesn't have anything emanating edge from it i.e. leaf node
  const isDeletable: boolean =
    edgesEmanatingOutOfNode.length > 0 ? false : true;

  const handleDeleteAction = () => {
    setCanvasAction({
      type: 'delete-node',
      data: {
        nodeId: nodeId,
        nodeType: node.type,
        shouldRefreshGraph:
          edgesGoingIntoNode.length + edgesEmanatingOutOfNode.length == 0
            ? false
            : true,
        isDummy: node.data?.isDummy,
      },
    });
  };

  const handleSelectNode = () => {
    setCanvasNode(node);
    if (isDeletable) {
      setCanvasAction({
        type: 'open-opconfig-panel',
        data: 'edit',
      });
    } else {
      // just view the config if its node in the middle of chain
      setCanvasAction({
        type: 'open-opconfig-panel',
        data: 'view',
      });
    }
  };

  useEffect(() => {
    // This event is triggered via the ProjectTree component
    if (
      canvasAction.type === 'update-canvas-node' &&
      canvasAction.data?.type === OPERATION_NODE &&
      canvasAction.data?.id === node.id
    ) {
      console.log('update selected canvas node action', node);
      setCanvasNode(node);
      setCanvasAction({ type: '', data: null });
    }
  }, [canvasAction]);

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

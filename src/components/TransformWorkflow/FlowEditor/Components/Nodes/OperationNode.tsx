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

  const { data, type } = node;
  // can only this node if it doesn't have anything emanating edge from it i.e. leaf node
  const isDeletable: boolean = edges.find(
    (edge: Edge) => edge.source === nodeId
  )
    ? false
    : true;

  // const handleDeleteAction = () => {
  //   data.triggerDelete(nodeId, type);
  // };
  const handleDeleteAction = () => {
    setCanvasAction({
      type: 'delete-node',
      data: { nodeId: nodeId, nodeType: type },
    });
  };

  // const handleClickOpenOperationPanel = () => {
  //   data.triggerSelectOperation(node);
  // };

  const handleClickOpenOperationPanel = () => {
    setCanvasAction({
      type: 'open-opconfig-panel',
      data: null,
    });

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
        <Box sx={{ display: 'flex' }}>
          <Box
            sx={{
              flex: '1',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            <Typography fontWeight="600" fontSize="12px" padding="8px">
              {operations.find((op) => op.slug === node.data.node.config?.type)
                ?.label || 'Not found'}
            </Typography>
          </Box>

          {isDeletable && (
            <Box sx={{ alignSelf: 'flex-end' }}>
              <IconButton
                onClick={handleClickOpenOperationPanel}
                data-testid="openoperationlist"
              >
                <ChevronRightIcon sx={{ width: '16px', height: '16px' }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

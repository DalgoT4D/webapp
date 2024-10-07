import { Box, Divider, IconButton, Typography } from '@mui/material';
import 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import { OperationNodeType } from '../Canvas';
import DeleteIcon from '@mui/icons-material/Delete';
import { OPERATION_NODE, operationIconMapping, operations } from '../../constant';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { useContext, useEffect } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import Image from 'next/image';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';

export function OperationNode(node: OperationNodeType) {
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const edges = useEdges();
  const nodeId = useNodeId();
  const { setCanvasAction, canvasAction } = useCanvasAction();
  const { setCanvasNode, canvasNode } = useCanvasNode();
  const { setPreviewAction } = usePreviewAction();

  const edgesGoingIntoNode: Edge[] = edges.filter((edge: Edge) => edge.target === nodeId);
  const edgesEmanatingOutOfNode: Edge[] = edges.filter((edge: Edge) => edge.source === nodeId);

  // can only delete/chain more ops if this node doesn't have anything emanating edge from it i.e. leaf node
  const isDeletable: boolean =
    permissions.includes('can_delete_dbt_operation') && edgesEmanatingOutOfNode.length <= 0;

  const handleDeleteAction = () => {
    setCanvasAction({
      type: 'delete-node',
      data: {
        nodeId: nodeId,
        nodeType: node.type,
        shouldRefreshGraph:
          edgesGoingIntoNode.length + edgesEmanatingOutOfNode.length == 0 ? false : true,
        isDummy: node.data?.isDummy,
      },
    });
  };

  const handleSelectNode = () => {
    setCanvasNode(node);
    setPreviewAction({ type: 'clear-preview', data: null });
    if (permissions.includes('can_edit_dbt_operation'))
      setCanvasAction({
        type: 'open-opconfig-panel',
        data: 'edit',
      });
    else if (permissions.includes('can_view_dbt_operation')) {
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
      setCanvasNode(node);
      setCanvasAction({ type: '', data: null });
    }
  }, [canvasAction]);

  return (
    <Box
      onClick={handleSelectNode}
      data-testid="nodeselectbox"
      sx={{
        border: node.id === canvasNode?.id || node.data?.isDummy ? '2px solid black' : '0px',
        borderRadius: '5px',
        borderStyle: 'dotted',
      }}
    >
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
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image src={operationIconMapping[node.data?.config.type]} alt="operation icon"></Image>
            {isDeletable && (
              <IconButton
                sx={{ position: 'absolute', right: -15, top: -15 }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteAction();
                }}
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
            <Typography fontWeight="600" fontSize="12px" padding="8px" sx={{ textAlign: 'center' }}>
              {operations.find((op) => op.slug === node.data.config?.type)?.label || 'Not found'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

import { Box, Divider, IconButton, Typography } from '@mui/material';
import 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import { OperationNodeType } from '../Canvas';
import DeleteIcon from '@mui/icons-material/Delete';
import { operationIconMapping, operations } from '../../constant';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { useContext, useEffect } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import Image from 'next/image';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { CanvasNodeTypeEnum, GenericNode, GenericNodeProps } from '@/types/transform-v2.types';

export function OperationNode(node: GenericNodeProps) {
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
        isDummy: node.data.isDummy,
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
      canvasAction.data?.type === CanvasNodeTypeEnum.Operation.toString() &&
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
        border: node.data?.isHighlighted
          ? '2px solid #00897B'
          : node.id === canvasNode?.id || node.data?.isDummy
            ? '2px dotted black'
            : '0px',
        borderRadius: '5px',
        boxShadow: node.data?.isHighlighted
          ? '0 0 0 3px rgba(0, 137, 123, 0.15), 0 0 12px rgba(0, 137, 123, 0.25)'
          : 'none',
        opacity: node.data?.isDimmed ? 0.45 : 1,
        filter: node.data?.isDimmed ? 'blur(1.5px)' : 'none',
        transition:
          'opacity 0.3s ease, filter 0.3s ease, border 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
        transform: node.data?.isHighlighted ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      <>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </>
      <Box
        sx={{
          width: '72px',
          background: 'white',
          boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.16)',
          borderRadius: '5px',
          position: 'relative',
        }}
      >
        {isDeletable && (
          <IconButton
            sx={{ position: 'absolute', right: -12, top: -12, padding: '2px', zIndex: 1 }}
            onClick={(event) => {
              event.stopPropagation();
              handleDeleteAction();
            }}
            data-testid="closebutton"
          >
            <DeleteIcon sx={{ fontSize: '14px' }} />
          </IconButton>
        )}
        <Box
          sx={{
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              height: '32px',
              width: '32px',
              background: '#F5FAFA',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={operationIconMapping[node.data.operation_config?.type]}
              alt="operation icon"
              width={20}
              height={20}
            />
          </Box>
        </Box>
        <Divider orientation="horizontal" sx={{ color: '#EEEEEE' }} />
        <Typography
          fontWeight="600"
          fontSize="9px"
          sx={{ textAlign: 'center', padding: '4px 4px', lineHeight: 1.3 }}
        >
          {operations.find((op) => op.slug === node.data.operation_config?.type)?.label ||
            'Not found'}
        </Typography>
      </Box>
    </Box>
  );
}

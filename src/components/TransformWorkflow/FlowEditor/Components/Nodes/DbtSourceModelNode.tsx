import { Box, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import { useContext } from 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { trimString } from '@/utils/common';
import { GlobalContext } from '@/contexts/ContextProvider';
import { GenericNodeProps } from '@/types/transform-v2.types';

export interface ColumnData {
  name: string;
  data_type: string | null;
}

export function DbtSourceModelNode(nodeProps: GenericNodeProps) {
  const { setPreviewAction } = usePreviewAction();
  const { setCanvasAction } = useCanvasAction();
  const { setCanvasNode } = useCanvasNode();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const edges = useEdges();
  const nodeId: string | null = useNodeId();

  const edgesGoingIntoNode: Edge[] = edges.filter((edge: Edge) => edge.target === nodeId);
  const edgesEmanatingOutOfNode: Edge[] = edges.filter((edge: Edge) => edge.source === nodeId);
  const isDeletable: boolean =
    permissions.includes('can_delete_dbt_model') && edgesEmanatingOutOfNode.length <= 0;

  const schema = nodeProps.data.dbtmodel?.schema || '';
  const tableName = nodeProps.data.dbtmodel?.name || nodeProps.data.name || '';
  const isUnpublished = nodeProps.type === 'model' && nodeProps.data.isPublished === false;

  const getNodeBackgroundColor = () => {
    if (isUnpublished) return '#50A85C';
    return '#00897B';
  };

  const handleDeleteAction = () => {
    setCanvasAction({
      type: 'delete-node',
      data: {
        nodeId: nodeId,
        nodeType: nodeProps.type,
        shouldRefreshGraph:
          edgesGoingIntoNode.length + edgesEmanatingOutOfNode.length == 0 ? false : true,
        isDummy: nodeProps.data.isDummy,
      },
    });
  };

  const handleSelectNode = () => {
    if (permissions.includes('can_create_dbt_model')) {
      setCanvasAction({
        type: 'open-opconfig-panel',
        data: 'create',
      });
    }
    setCanvasNode(nodeProps);
    setPreviewAction({
      type: 'preview',
      data: {
        schema: nodeProps.data.dbtmodel?.schema || '',
        table: nodeProps.data.dbtmodel?.name || '',
      },
    });
  };

  const handleViewDetail = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCanvasNode(nodeProps);
    setCanvasAction({
      type: 'open-node-detail-modal',
      data: {
        schema: nodeProps.data.dbtmodel?.schema || '',
        table: nodeProps.data.dbtmodel?.name || '',
        nodeName: nodeProps.data.name || '',
      },
    });
  };

  const columnCount = nodeProps.data.output_columns?.length || 0;

  return (
    <Box
      onClick={handleSelectNode}
      sx={{
        position: 'relative',
        paddingTop: '10px', // space for schema badge
        opacity: nodeProps.data.isDimmed ? 0.2 : 1,
        filter: nodeProps.data.isDimmed ? 'grayscale(0.6)' : 'none',
        transition: 'opacity 0.3s ease, filter 0.3s ease, transform 0.2s ease',
        transform: nodeProps.data.isHighlighted ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      <>
        <Handle type="target" position={Position.Left} style={{ top: '60%' }} />
        <Handle type="source" position={Position.Right} style={{ top: '60%' }} />
      </>

      {/* Schema label - sits above the node in grey */}
      {schema && (
        <Typography
          sx={{
            position: 'absolute',
            top: '0px',
            left: '8px',
            color: '#757575',
            fontSize: '8px',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0.3px',
          }}
        >
          {schema}
        </Typography>
      )}

      {/* Main node body */}
      <Box
        sx={{
          borderRadius: '5px',
          display: 'flex',
          flexDirection: 'column',
          width: '160px',
          border: nodeProps.data.isHighlighted
            ? '2px solid #00897B'
            : isUnpublished
              ? '2px dashed #50A85C'
              : nodeProps.selected || nodeProps.data.isDummy
                ? '2px dotted black'
                : '0px',
          boxShadow: nodeProps.data.isHighlighted
            ? '0 0 0 3px rgba(0, 137, 123, 0.15), 0 0 12px rgba(0, 137, 123, 0.25)'
            : '0px 2px 4px 0px rgba(0, 0, 0, 0.16)',
          transition: 'border 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Header - table name + delete */}
        <Box
          sx={{
            background: getNodeBackgroundColor(),
            display: 'flex',
            borderRadius: '3px 3px 0px 0px',
            alignItems: 'center',
            padding: '6px 8px',
            gap: '4px',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="white"
              sx={{ fontSize: '11px', lineHeight: 1.3 }}
            >
              {trimString(tableName, 20)}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            {isDeletable && (
              <IconButton
                sx={{ color: 'white', padding: '2px' }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteAction();
                }}
                data-testid="closebutton"
              >
                <DeleteIcon sx={{ fontSize: '14px' }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Footer - column count + view */}
        <Box
          sx={{
            background: '#F8F8F8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '0px 0px 3px 3px',
            padding: '4px 8px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TableChartOutlined sx={{ fontSize: '12px', color: '#757575' }} />
            <Typography sx={{ fontSize: '10px', color: '#757575', fontWeight: 500 }}>
              {columnCount} cols
            </Typography>
          </Box>
          <IconButton
            sx={{ padding: '2px', color: '#757575' }}
            onClick={handleViewDetail}
            data-testid="view-detail-button"
          >
            <VisibilityIcon sx={{ fontSize: '14px' }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

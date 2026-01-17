import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  tableCellClasses,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position, useNodeId, useEdges, Edge, NodeProps } from 'reactflow';
import { SrcModelNodeType } from '../Canvas';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { trimString } from '@/utils/common';
import styled from '@emotion/styled';
import { GlobalContext } from '@/contexts/ContextProvider';
import { GenericNode, GenericNodeProps } from '@/types/transform-v2.types';

export interface ColumnData {
  name: string;
  data_type: string | null;
}

const StyledTableCell = styled(TableCell)(() => ({
  padding: '4px 0px 4px 10px',
  fontSize: '11px',
  [`&.${tableCellClasses.head}`]: {
    fontWeight: 600,
    backgroundColor: '#EEF3F3',
  },
  [`&.${tableCellClasses.body}`]: {
    fontWeight: 500,
    color: '#212121',
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  borderRadius: 0,
  '&:nth-of-type(odd)': {
    backgroundColor: '#F7F7F7',
  },
  '&:last-child td, &:last-child th': {
    borderBottom: 0,
  },
}));

const NodeDataTableComponent = ({ columns }: { columns: ColumnData[] }) => {
  return (
    <Table sx={{ borderSpacing: '0px' }}>
      <TableHead>
        <TableRow
          sx={{
            boxShadow: 'none',
            background: '#F5F5F5',
          }}
          key={'NAME'}
        >
          <StyledTableCell align="left" sx={{ borderRight: '1px solid #E8E8E8' }}>
            NAME
          </StyledTableCell>
          <StyledTableCell align="left">TYPE</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {columns.map((row: ColumnData) => (
          <StyledTableRow key={row.name}>
            <StyledTableCell align="left" sx={{ borderRight: '1px solid #E8E8E8' }}>
              {row.name}
            </StyledTableCell>
            <StyledTableCell align="left">{row.data_type}</StyledTableCell>
          </StyledTableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export function DbtSourceModelNode(nodeProps: GenericNodeProps) {
  const { data: session } = useSession();
  const { setPreviewAction } = usePreviewAction();
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { setCanvasNode } = useCanvasNode();
  const [columns, setColumns] = useState<Array<any>>([]);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const edges = useEdges();
  const nodeId: string | null = useNodeId();

  const edgesGoingIntoNode: Edge[] = edges.filter((edge: Edge) => edge.target === nodeId);
  const edgesEmanatingOutOfNode: Edge[] = edges.filter((edge: Edge) => edge.source === nodeId);
  // can only this node if it doesn't have anything emanating edge from it i.e. leaf node
  const isDeletable: boolean =
    permissions.includes('can_delete_dbt_model') && edgesEmanatingOutOfNode.length <= 0;

  // Determine node color based on publish status (only for model nodes)
  const getNodeBackgroundColor = () => {
    if (nodeProps.type === 'model' && nodeProps.data.isPublished === false) {
      return '#50A85C'; // Lighter green for unpublished model nodes
    }
    return '#00897B'; // Default green for published or non-model nodes
  };

  const cacheRef = useRef<{ [key: string]: ColumnData[] }>({});

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

  useMemo(() => {
    const cacheKey = `${nodeProps.data.dbtmodel?.schema}/${nodeProps.data.dbtmodel?.name}-${nodeId}`;

    if (cacheRef.current[cacheKey]) {
      setColumns(cacheRef.current[cacheKey]);
    } else {
      (async () => {
        try {
          const data: ColumnData[] = await httpGet(
            session,
            `warehouse/table_columns/${nodeProps.data.dbtmodel?.schema}/${nodeProps.data.dbtmodel?.name}`
          );
          cacheRef.current[cacheKey] = data;
          setColumns(data);
        } catch (error) {
          console.log(error);
        }
      })();
    }
  }, [session, edges]);

  useEffect(() => {
    if (canvasAction.type === 'refresh-canvas') {
      cacheRef.current = {};
    }
  }, [canvasAction]);

  return (
    <Box
      onClick={handleSelectNode}
      sx={{
        display: 'flex',
        border: nodeProps.selected || nodeProps.data.isDummy ? '2px solid black' : '0px',
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
          borderRadius: '5px',
          display: 'flex',
          flexDirection: 'column',
          width: '250px',
        }}
      >
        <Box
          sx={{
            background: getNodeBackgroundColor(),
            display: 'flex',
            borderRadius: '5px 5px 0px 0px',
            alignItems: 'center',
            padding: '8px 12px',
            gap: '30px',
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="white">
              {trimString(nodeProps.data.name || '', 25)}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            {isDeletable && (
              <IconButton
                sx={{ color: 'white' }}
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
        <Box
          sx={{
            background: '#F8F8F8',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0px 0px 4px 4px',
            maxHeight: '120px',
            boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.16)',
            overflow: 'auto',
            width: '100%',
          }}
          onWheelCapture={(event) => {
            event.stopPropagation();
          }}
        >
          {columns.length > 0 ? (
            <Box>
              <NodeDataTableComponent columns={columns} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
                width: '100%',
              }}
            >
              <Typography>Please check logs</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

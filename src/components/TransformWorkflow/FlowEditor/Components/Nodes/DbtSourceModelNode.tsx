import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMemo, useState } from 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { SrcModelNodeType, UIOperationType } from '../Canvas';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';

export interface ColumnData {
  name: string;
  data_type: string;
}

const NodeDataTableComponent = ({ columns }: { columns: ColumnData[] }) => {
  return (
    <Table sx={{ borderSpacing: '0px' }}>
      <TableBody>
        <TableRow
          sx={{
            boxShadow: 'none',
            background: '#F5F5F5',
          }}
          key={'NAME'}
        >
          <TableCell
            sx={{
              padding: '4px 0px 4px 10px',
              fontWeight: 600,
              color: '#212121',
            }}
            align="left"
          >
            NAME
          </TableCell>
          <TableCell
            sx={{
              padding: '4px 0px 4px 10px',
              width: '40%',
              borderLeft: '1px solid #F8F8F8',
              fontWeight: 600,
              color: '#212121',
            }}
            align="left"
          >
            DATA
          </TableCell>
        </TableRow>
        {columns.map((row: ColumnData, idx: number) => (
          <TableRow
            sx={{
              boxShadow: 'none',
              background: idx % 2 === 0 ? '#E1E1E1' : '#F5F5F5',
              fontSize: '11px',
            }}
            key={row.name}
          >
            <TableCell
              sx={{
                padding: '4px 0px 4px 10px',
                color: '#212121',
                fontWeight: 500,
              }}
              align="left"
            >
              {row.name}
            </TableCell>
            <TableCell
              sx={{
                padding: '4px 0px 4px 10px',
                width: '40%',
                borderLeft: '1px solid #F8F8F8',
                color: '#212121',
                fontWeight: 500,
              }}
              align="left"
            >
              {row.data_type}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export function DbtSourceModelNode(node: SrcModelNodeType) {
  const { data: session } = useSession();
  const { previewAction, setPreviewAction } = usePreviewAction();
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode, setCanvasNode } = useCanvasNode();
  const [columns, setColumns] = useState<Array<any>>([]);

  const edges = useEdges();
  const nodeId: string | null = useNodeId();

  // can only this node if it doesn't have anything emanating edge from it i.e. leaf node
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
    setCanvasAction({
      type: 'open-opconfig-panel',
      data: null,
    });
    setCanvasNode(node);
    setPreviewAction({ type: 'preview', data: node.data });
  };

  useMemo(() => {
    (async () => {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${node.data.schema}/${node.data.input_name}`
        );
        setColumns(data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [session, edges]);

  return (
    <Box sx={{ display: 'flex' }}>
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
            background: '#C3C3C3',
            display: 'flex',
            borderRadius: '4px 4px 0px 0px',
            alignItems: 'center',
            padding: '10px 10px',
            gap: '30px',
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {`${node.data.input_name}`}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
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
        <Box
          sx={{
            background: '#F8F8F8',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0px 0px 4px 4px',
            height: '120px',
            boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.16)',
            overflow: 'auto',
            width: '100%',
          }}
          onClick={handleSelectNode}
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
              <Typography>
                Please click run to materialize your model
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

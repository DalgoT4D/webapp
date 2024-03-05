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
import { useEffect, useMemo, useState } from 'react';
import { Handle, Position, useNodeId, useEdges, Edge } from 'reactflow';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { SrcModelNodeType } from '../Canvas';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { operations } from '../OperationConfigForms/constant';

interface ColumnData {
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
  const [openOperationList, setOpenOperationList] = useState(false);
  const [columns, setColumns] = useState<Array<any>>([]);
  const [operationSlug, setOperationSlug] = useState<string | null>(null);

  const edges = useEdges();
  const nodeId: string | null = useNodeId();
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

  const handlePreviewAction = () => {
    data.triggerPreview(data.node);
  };

  const handleOpenOperationList = () => {
    console.log('open operation list');
    setOpenOperationList(!openOperationList);
  };

  const handleSelectNewOperation = (event: any, opSlug: string) => {
    console.log('selected operation', opSlug);
    setOperationSlug(opSlug);
    setOpenOperationList(false);
  };

  useMemo(() => {
    (async () => {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${node.data.node.schema}/${node.data.node.input_name}`
        );
        setColumns(data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [session, edges]);

  return (
    <Box sx={{ display: 'flex' }}>
      {!openOperationList && (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </>
      )}
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
            padding: '0px 10px',
            gap: '30px',
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              onClick={handlePreviewAction}
            >
              {`${data.node.input_name}`}
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
            <IconButton
              onClick={handleOpenOperationList}
              data-testid="openoperationlist"
            >
              <ChevronRightIcon />
            </IconButton>
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
              <Typography>Columns not available</Typography>
            </Box>
          )}
        </Box>
      </Box>
      {openOperationList && (
        <Box
          sx={{
            // position: 'sticky',
            // zIndex: '1000',
            marginLeft: '10px',
            borderRadius: '6px',
            width: '200px',
            height: '300px',
            ':hover': { cursor: 'pointer' },
            overflow: 'auto',
          }}
        >
          <Table sx={{ borderSpacing: '0px' }}>
            <TableBody>
              {operations.map((op, idx: number) => (
                <TableRow
                  sx={{
                    boxShadow: 'none',
                    fontSize: '13px',
                  }}
                  key={op.slug}
                >
                  <TableCell
                    sx={{
                      padding: '10px 4px 10px 10px',
                      color: '#7D8998',
                      fontWeight: 600,
                      ':hover': { background: '#F5F5F5' },
                    }}
                    align="left"
                    onClick={(event) =>
                      handleSelectNewOperation(event, op.slug)
                    }
                  >
                    {op.label}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

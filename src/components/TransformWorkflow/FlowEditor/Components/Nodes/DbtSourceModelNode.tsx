import {
  Box,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from 'reactflow';
import { Close } from '@mui/icons-material';
import PreviewIcon from '@mui/icons-material/Preview';
import { DbtSourceModel } from '../../FlowEditor';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface DbtSourceModelNodeData {
  label: string;
  triggerDelete: (nodeId: string | null) => void;
  triggerPreview: (sourceModel: DbtSourceModel | null) => void;
  node: DbtSourceModel;
}

interface DbtSourceModelNodeProps {
  data: DbtSourceModelNodeData;
}

export function DbtSourceModelNode({ data }: DbtSourceModelNodeProps) {
  const [openOperationList, setOpenOperationList] = useState(false);
  const [operationSlug, setOperationSlug] = useState<string | null>(null);

  const nodeId: string | null = useNodeId();

  const handleDeleteAction = () => {
    data.triggerDelete(nodeId);
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

  const rows = [
    { name: 'Month', dataType: 'string' },
    { name: 'ngo', dataType: 'string' },
    { name: 'spoc', dataType: 'string' },
    { name: 'measure', dataType: 'string' },
    { name: 'Indicator', dataType: 'string' },
  ];

  const operations = [
    { label: 'Flatten', slug: 'flatte' },
    { label: 'Flatten json', slug: 'flattenjson' },
    { label: 'Cast data type', slug: 'castdatatypes' },
    { label: 'Coalesce columns', slug: 'coalescecolumns' },
    { label: 'Arithmetic', slug: 'arithmetic' },
    { label: 'Concat', slug: 'concat' },
    { label: 'Drop columns', slug: 'dropcolumns' },
    { label: 'Rename columns', slug: 'renamecolumns' },
    { label: 'Regex extraction', slug: 'regexextraction' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        sx={{
          borderRadius: '5px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!openOperationList && (
          <>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
          </>
        )}
        <Box
          sx={{
            background: '#C3C3C3',
            display: 'flex',
            borderRadius: '4px 4px 0px 0px',
            alignItems: 'center',
            padding: '0px 10px',
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              onClick={handlePreviewAction}
            >
              {`${data.node.schema}.${data.node.input_name}`}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            <IconButton onClick={handleDeleteAction} data-testid="closebutton">
              <Close />
            </IconButton>
            <IconButton
              onClick={handleOpenOperationList}
              data-testid="closebutton"
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
            overflow: 'auto',
          }}
        >
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
              {rows.map((row, idx: number) => (
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
                    {row.dataType}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
      {openOperationList && (
        <Box
          sx={{
            position: 'sticky',
            zIndex: '1000',
            marginLeft: '10px',
            width: '150px',
            borderRadius: '6px',
            height: '300px',
            overflow: 'auto',
            ':hover': { cursor: 'pointer' },
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

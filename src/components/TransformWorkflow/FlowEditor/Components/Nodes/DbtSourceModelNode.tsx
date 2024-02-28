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
import { useCallback } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from 'reactflow';
import { Close } from '@mui/icons-material';
import PreviewIcon from '@mui/icons-material/Preview';
import { DbtSourceModel } from '../../FlowEditor';

interface DbtSourceModelNodeData {
  label: string;
  triggerDelete: (nodeId: string | null) => void;
  triggerPreview: (sourceModel: DbtSourceModel | null) => void;
  dbtSourceModel: DbtSourceModel;
}

interface DbtSourceModelNodeProps {
  data: DbtSourceModelNodeData;
}

export function DbtSourceModelNode({ data }: DbtSourceModelNodeProps) {
  console.log('inside custom node', data);

  const nodeId: string | null = useNodeId();

  const handleDeleteAction = () => {
    data.triggerDelete(nodeId);
  };

  const handlePreviewAction = () => {
    data.triggerPreview(data.dbtSourceModel);
  };

  const rows = [
    { name: 'Month', dataType: 'string' },
    { name: 'ngo', dataType: 'string' },
    { name: 'spoc', dataType: 'string' },
    { name: 'measure', dataType: 'string' },
    { name: 'Indicator', dataType: 'string' },
    { name: 'Month', dataType: 'string' },
    { name: 'ngo', dataType: 'string' },
    { name: 'spoc', dataType: 'string' },
    { name: 'measure', dataType: 'string' },
    { name: 'Indicator', dataType: 'string' },
  ];

  return (
    <>
      <Box
        sx={{
          borderRadius: '5px',
          display: 'flex',
          flexDirection: 'column',
          width: '200px',
        }}
      >
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
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
              {`${data.dbtSourceModel.schema}.${data.dbtSourceModel.input_name}`}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            <IconButton onClick={handleDeleteAction} data-testid="closebutton">
              <Close />
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
                <TableCell sx={{ padding: '4px 0px 4px 10px' }} align="left">
                  NAME
                </TableCell>
                <TableCell
                  sx={{
                    padding: '4px 0px 4px 10px',
                    width: '40%',
                    borderLeft: '1px solid #F8F8F8',
                  }}
                  align="left"
                >
                  DATA TYPE
                </TableCell>
              </TableRow>
              {rows.map((row, idx: number) => (
                <TableRow
                  sx={{
                    boxShadow: 'none',
                    background: idx % 2 === 0 ? '#E1E1E1' : '#F5F5F5',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}
                  key={row.name}
                >
                  <TableCell sx={{ padding: '4px 0px 4px 10px' }} align="left">
                    {row.name}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '4px 0px 4px 10px',
                      width: '40%',
                      borderLeft: '1px solid #F8F8F8',
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
    </>
  );
}

import {
  Box,
  Divider,
  IconButton,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { OperationNodeType, SrcModelNodeType, UIOperationType } from './Canvas';
// import { operations } from './OperationConfigForms/constant';
import InfoIcon from '@mui/icons-material/Info';
import { RENAME_COLUMNS_OP } from '../constant';
import RenameColumnOpForm from './OperationConfigForms/RenameColumnOpForm';
import { operations } from '../constant';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface OperationConfigProps {
  sx: SxProps;
  openPanel: boolean;
  setOpenPanel: (...args: any) => void;
  node: SrcModelNodeType | OperationNodeType | null;
}

export interface OperationFormProps {
  node: SrcModelNodeType | OperationNodeType;
  operation: UIOperationType;
  sx: SxProps;
  clearOperation: (...args: any) => void;
}

const operationComponentMapping: any = {
  [RENAME_COLUMNS_OP]: ({
    node,
    operation,
    sx,
    clearOperation,
  }: OperationFormProps) => (
    <RenameColumnOpForm
      node={node}
      operation={operation}
      sx={sx}
      clearOperation={clearOperation}
    />
  ), // add more operations here
};

const OperationForm = ({
  operation,
  node,
  sx,
  clearOperation,
}: OperationFormProps) => {
  return operationComponentMapping[operation.slug]({
    operation,
    node,
    sx,
    clearOperation,
  });
};

const OperationConfigLayout = ({
  node,
  openPanel,
  setOpenPanel,
  sx,
}: OperationConfigProps) => {
  const [selectedOp, setSelectedOp] = useState<UIOperationType | null>();

  if (!openPanel) return null;

  if (!node) return <Box sx={{ ...sx }}>Please select a node</Box>;

  const PanelHeader = () => {
    return (
      <Box>
        <Box
          sx={{
            padding: '6px 16px 6px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            border: '0px 0px 1px 0px',
            alignItems: 'center',
          }}
        >
          {selectedOp && (
            <IconButton
              onClick={() => setSelectedOp(null)}
              data-testid="openoperationlist"
            >
              <ChevronLeftIcon fontSize="small" width="16px" height="16px" />
            </IconButton>
          )}
          <Typography
            fontWeight={600}
            fontSize="15px"
            color="#5E5E5E"
            lineHeight={'21px'}
          >
            {selectedOp ? selectedOp.label : 'Functions'}
          </Typography>
          <Box sx={{ width: '16px', height: '16px' }}>
            <InfoIcon sx={{ color: '#D9D9D9' }} />
          </Box>
        </Box>
        <Divider orientation="horizontal" />
      </Box>
    );
  };

  const PanelFooter = () => {
    return (
      <Box
        sx={{
          padding: '6px 16px 6px 16px',
          borderTop: '1px solid #F9F9F9',
          marginBottom: '0px',
          height: '32px',
        }}
      >
        <Typography
          fontWeight={500}
          fontSize="12px"
          color="#BBBBBB"
          lineHeight="19.2px"
          letterSpacing={'2%'}
        >
          Select Functions
        </Typography>
      </Box>
    );
  };

  const OperationList = ({ sx }: { sx: SxProps }) => {
    return (
      <Table sx={{ borderSpacing: '0px', ...sx }}>
        <TableBody>
          {operations.map((op) => (
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
                onClick={(event) => setSelectedOp(op)}
              >
                {op.label}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Box
      sx={{
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          gap: '5px',
        }}
      >
        <PanelHeader />
        <Box
          sx={{
            flex: '1 1 auto',
            overflowY: 'auto',
          }}
        >
          {selectedOp ? (
            <OperationForm
              sx={{ marginTop: '17px' }}
              operation={selectedOp}
              node={node}
              clearOperation={() => setSelectedOp(null)}
            />
          ) : (
            <OperationList
              sx={{
                marginTop: '5px',
                ':hover': { cursor: 'pointer' },
              }}
            />
          )}
        </Box>
        <PanelFooter />
      </Box>
    </Box>
  );
};

export default OperationConfigLayout;

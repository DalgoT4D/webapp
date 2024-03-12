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
import CloseIcon from '@mui/icons-material/Close';
import {
  OperationNodeData,
  OperationNodeType,
  SrcModelNodeType,
  UIOperationType,
} from './Canvas';
// import { operations } from './OperationConfigForms/constant';
import InfoIcon from '@mui/icons-material/Info';
import { OPERATION_NODE, RENAME_COLUMNS_OP, SRC_MODEL_NODE } from '../constant';
import RenameColumnOpForm from './OperationPanel/Forms/RenameColumnOpForm';
import { operations } from '../constant';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { DbtSourceModel } from '../FlowEditor';
import CreateTableOrAddFunction from './OperationPanel/CreateTableOrAddFunction';

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
  const { data: session } = useSession();
  const [selectedOp, setSelectedOp] = useState<UIOperationType | null>();
  // const [showFunctionsList, setShowFunctionsList] = useState<boolean>(false);

  const handleClosePanel = () => {
    setOpenPanel(false);
    setSelectedOp(null);
  };

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
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
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
          <IconButton
            onClick={handleClosePanel}
            data-testid="closeoperationpanel"
          >
            <CloseIcon fontSize="small" width="16px" height="16px" />
          </IconButton>
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

  const handleCreateTable = () => {
    console.log('create table');
  };

  const handleAddFunction = () => {
    console.log('add function');
  };

  const handleClearPanel = () => {
    console.log('clear panel');
    setSelectedOp(null);
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
              clearOperation={handleClearPanel}
            />
          ) : node?.type === SRC_MODEL_NODE ? (
            <OperationList
              sx={{
                marginTop: '5px',
                ':hover': { cursor: 'pointer' },
              }}
            />
          ) : (
            <CreateTableOrAddFunction
              clickCreateTable={handleCreateTable}
              clickAddFunction={handleAddFunction}
            />
          )}
        </Box>
        <PanelFooter />
      </Box>
    </Box>
  );
};

export default OperationConfigLayout;

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
  DbtSourceModel,
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
import CreateTableOrAddFunction from './OperationPanel/CreateTableOrAddFunction';
import { set } from 'cypress/types/lodash';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';
import CreateTableForm from './OperationPanel/Forms/CreateTableForm';

interface OperationConfigProps {
  sx: SxProps;
  openPanel: boolean;
  setOpenPanel: (...args: any) => void;
}

export interface OperationFormProps {
  node: SrcModelNodeType | OperationNodeType | null | undefined;
  operation: UIOperationType;
  sx: SxProps;
  continueOperationChain: (...args: any) => void;
  clearAndClosePanel: (...args: any) => void;
}

const operationComponentMapping: any = {
  [RENAME_COLUMNS_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
  }: OperationFormProps) => (
    <RenameColumnOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
    />
  ), // add more operations here
};

const OperationForm = ({
  operation,
  node,
  sx,
  continueOperationChain,
  clearAndClosePanel,
}: OperationFormProps) => {
  if (operation.slug === 'create-table') {
    return (
      <CreateTableForm
        node={node}
        operation={operation}
        sx={sx}
        continueOperationChain={continueOperationChain}
        clearAndClosePanel={clearAndClosePanel}
      />
    );
  }

  if (!Object.keys(operationComponentMapping).includes(operation.slug)) {
    return <>Operation not yet supported</>;
  }

  return operationComponentMapping[operation.slug]({
    operation,
    node,
    sx,
    continueOperationChain,
    clearAndClosePanel,
  });
};

const OperationConfigLayout = ({
  openPanel,
  setOpenPanel,
  sx,
}: OperationConfigProps) => {
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode, setCanvasNode } = useCanvasNode();
  const [selectedOp, setSelectedOp] = useState<UIOperationType | null>();
  const [showFunctionsList, setShowFunctionsList] = useState<boolean>(false);

  const handleClosePanel = () => {
    setOpenPanel(false);
    setShowFunctionsList(false);
    setSelectedOp(null);
  };

  if (!openPanel) return null;

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

  const handleCreateTable = async () => {
    console.log('create table', canvasNode);
    setSelectedOp({ slug: 'create-table', label: 'Create Output Table' });
  };

  const handleAddFunction = () => {
    console.log('add function');
    setShowFunctionsList(true);
  };

  const prepareForNextOperation = (opNodeData: OperationNodeData) => {
    setCanvasAction({ type: 'refresh-canvas', data: null });
    setSelectedOp(null);
    setCanvasNode({
      id: opNodeData.id,
      type: OPERATION_NODE,
      data: opNodeData,
    } as OperationNodeType);
    setShowFunctionsList(false);
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
              sx={{}}
              operation={selectedOp}
              node={canvasNode}
              continueOperationChain={prepareForNextOperation}
              clearAndClosePanel={handleClosePanel}
            />
          ) : showFunctionsList || canvasNode?.type === SRC_MODEL_NODE ? (
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

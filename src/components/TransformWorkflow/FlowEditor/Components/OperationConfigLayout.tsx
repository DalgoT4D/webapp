import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  SxProps,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  OperationNodeData,
  OperationNodeType,
  SrcModelNodeType,
  UIOperationType,
  getNextNodePosition,
} from './Canvas';
// import { operations } from './OperationConfigForms/constant';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import {
  OPERATION_NODE,
  RENAME_COLUMNS_OP,
  SRC_MODEL_NODE,
  JOIN_OP,
  REPLACE_COLUMN_VALUE_OP,
  DROP_COLUMNS_OP,
  COALESCE_COLUMNS_OP,
  ARITHMETIC_OP,
  GROUPBY_OP,
  WHERE_OP,
  CAST_DATA_TYPES_OP,
  AGGREGATE_OP,
  CASEWHEN_OP,
  UNION_OP,
} from '../constant';
import RenameColumnOpForm from './OperationPanel/Forms/RenameColumnOpForm';
import CastColumnOpForm from './OperationPanel/Forms/CastColumnOpForm';
import DropColumnOpForm from './OperationPanel/Forms/DropColumnOpForm';
import { operations } from '../constant';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CreateTableOrAddFunction from './OperationPanel/CreateTableOrAddFunction';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';
import CreateTableForm from './OperationPanel/Forms/CreateTableForm';
import { useReactFlow } from 'reactflow';
import JoinOpForm from './OperationPanel/Forms/JoinOpForm';
import ReplaceValueOpForm from './OperationPanel/Forms/ReplaceValueOpForm';
import CoalesceOpForm from './OperationPanel/Forms/CoalesceOpForm';
import ArithmeticOpForm from './OperationPanel/Forms/ArithmeticOpForm';
import AggregationOpForm from './OperationPanel/Forms/AggregationOpForm';
import GroupByOpForm from './OperationPanel/Forms/GroupByOpForm';
import WhereFilterOpForm from './OperationPanel/Forms/WhereFilterOpForm';
import CaseWhenOpForm from './OperationPanel/Forms/CaseWhenOpForm';
import UnionTablesOpForm from './OperationPanel/Forms/UnionTablesOpForm';
import { generateDummyOperationlNode } from './dummynodes';

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
  dummyNodeId: string;
  action: 'create' | 'view' | 'edit';
}

const operationComponentMapping: any = {
  [RENAME_COLUMNS_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <RenameColumnOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [JOIN_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <JoinOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [REPLACE_COLUMN_VALUE_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <ReplaceValueOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [COALESCE_COLUMNS_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <CoalesceOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [ARITHMETIC_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <ArithmeticOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [DROP_COLUMNS_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <DropColumnOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [CAST_DATA_TYPES_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <CastColumnOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [AGGREGATE_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <AggregationOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [GROUPBY_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <GroupByOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [WHERE_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <WhereFilterOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [CASEWHEN_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <CaseWhenOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
  [UNION_OP]: ({
    node,
    operation,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  }: OperationFormProps) => (
    <UnionTablesOpForm
      node={node}
      operation={operation}
      sx={sx}
      continueOperationChain={continueOperationChain}
      clearAndClosePanel={clearAndClosePanel}
      dummyNodeId={dummyNodeId}
      action={action}
    />
  ),
};

const OperationForm = ({
  operation,
  node,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
  action,
}: OperationFormProps) => {
  if (operation === null || operation === undefined) {
    return null;
  }

  if (operation.slug === 'create-table') {
    return (
      <CreateTableForm
        node={node}
        operation={operation}
        sx={sx}
        continueOperationChain={continueOperationChain}
        clearAndClosePanel={clearAndClosePanel}
        dummyNodeId={dummyNodeId}
        action={action}
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
    dummyNodeId,
    action,
  });
};

const OperationConfigLayout = ({
  openPanel,
  setOpenPanel,
  sx,
}: OperationConfigProps) => {
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode } = useCanvasNode();
  const [selectedOp, setSelectedOp] = useState<UIOperationType | null>();
  const [showFunctionsList, setShowFunctionsList] = useState<boolean>(false);
  const dummyNodeIdRef: any = useRef(null);
  const contentRef: any = useRef(null);
  const panelOpFormState = useRef<'create' | 'view' | 'edit'>('view');

  const { addEdges, addNodes, deleteElements, getNodes } = useReactFlow();

  const handleClosePanel = () => {
    deleteElements({ nodes: [{ id: dummyNodeIdRef.current }] });
    setOpenPanel(false);
    setShowFunctionsList(false);
    setSelectedOp(null);
  };

  const handleSelectOp = (op: UIOperationType) => {
    // Create the dummy node on canvas
    // For multi input operation we might have to do it inside the operation once they select the other inputs
    // console.log('select op', op, canvasNode);
    const dummyTargetNodeData: any = generateDummyOperationlNode(
      canvasNode,
      op
    );
    const newEdge: any = {
      id: `${canvasNode ? canvasNode.id : ''}_${dummyTargetNodeData.id}`,
      source: canvasNode ? canvasNode.id : '',
      target: dummyTargetNodeData.id,
      sourceHandle: null,
      targetHandle: null,
    };
    dummyNodeIdRef.current = dummyTargetNodeData.id;
    addNodes([dummyTargetNodeData]);
    addEdges([newEdge]);
    setSelectedOp(op);
  };

  useEffect(() => {
    if (canvasAction.type === 'open-opconfig-panel') {
      setOpenPanel(true);
      panelOpFormState.current = canvasAction.data || 'view';
      if (panelOpFormState.current === 'view') {
        setSelectedOp({ slug: 'renamecolumns', label: 'Rename Columns' });
      }
    }

    if (canvasAction.type === 'close-reset-opconfig-panel') {
      handleClosePanel();
    }
  }, [canvasAction]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [selectedOp]);

  if (!openPanel) return null;

  const PanelHeader = () => {
    const handleBackbuttonAction = () => {
      //dummy nodes are generate only while creating & not updating
      if (panelOpFormState.current === 'create') {
        let dummyNodeIds: string[] = [dummyNodeIdRef.current];
        getNodes().forEach((node) => {
          if (node.data.isDummy) {
            dummyNodeIds.push(node.id);
          }
        });
        deleteElements({
          nodes: dummyNodeIds.map((nodeId: any) => ({
            id: nodeId,
          })),
        });
        setSelectedOp(null);
      }
    };

    const handleBackButtonOnCreateTableAddFunction = () => {
      // show the form
      let { config } = canvasNode?.data as OperationNodeData;
      if (config && config.type) {
        const editingOperation = operations.find(
          (op) => op.slug === config.type
        );
        setSelectedOp({
          slug: editingOperation?.slug || '',
          label: editingOperation?.label || '',
        });
      }
      // set the state to edit
      panelOpFormState.current = 'edit';
    };

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
          {((selectedOp && panelOpFormState.current !== 'view') ||
            panelState === 'create-table-or-add-function') && (
            <IconButton
              onClick={
                panelState === 'create-table-or-add-function'
                  ? handleBackButtonOnCreateTableAddFunction
                  : handleBackbuttonAction
              }
              data-testid="openoperationlist"
            >
              <ChevronLeftIcon fontSize="small" width="16px" height="16px" />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
            <Typography
              fontWeight={600}
              fontSize="15px"
              color="#0F2440"
              lineHeight={'21px'}
            >
              {selectedOp ? selectedOp.label : 'Functions'}
            </Typography>
            <Box sx={{ width: '1px', height: '12px' }}>
              <InfoIcon fontSize="small" sx={{ color: '#888888' }} />
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
    // These are the operations that can't be chained
    const cantChainOperationsInMiddle: string[] = [
      UNION_OP,
      CAST_DATA_TYPES_OP,
    ];

    return (
      <Box sx={{ borderSpacing: '0px', ...sx }}>
        <List>
          {operations.map((op, index) => {
            const canSelectOperation = !(
              cantChainOperationsInMiddle.includes(op.slug) &&
              canvasNode?.type === OPERATION_NODE
            );
            return (
              <ListItemButton
                key={op.slug}
                sx={{
                  padding: '10px 20px',
                  color: '#0F2440',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#F5FAFA',
                  },
                }}
                onClick={
                  canSelectOperation
                    ? () => {
                        handleSelectOp(op);
                      }
                    : undefined
                }
              >
                {canSelectOperation ? (
                  op.label
                ) : (
                  <Tooltip
                    title={'Please create a table to use this function'}
                    placement="top"
                  >
                    <span>{op.label}</span>
                  </Tooltip>
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
  };

  const handleCreateTable = async () => {
    console.log('create table', canvasNode);
    setSelectedOp({ slug: 'create-table', label: 'Create Output Table' });
  };

  const handleAddFunction = () => {
    setShowFunctionsList(true);
    panelOpFormState.current = 'create';
  };

  const prepareForNextOperation = async (opNodeData: OperationNodeData) => {
    deleteElements({
      nodes: [{ id: dummyNodeIdRef.current }],
    });
    if (opNodeData.id !== canvasNode?.id) {
      const { x: xnew, y: ynew } = getNextNodePosition([
        {
          position: { x: canvasNode?.xPos, y: canvasNode?.yPos },
          height: 200,
        },
      ]);

      addNodes([
        {
          id: opNodeData.id,
          type: OPERATION_NODE,
          data: opNodeData,
          position: { x: xnew, y: ynew },
        },
      ]);
      addEdges([
        {
          id: `${canvasNode ? canvasNode.id : ''}_${opNodeData.id}`,
          source: canvasNode ? canvasNode.id : '',
          target: opNodeData.id,
          sourceHandle: null,
          targetHandle: null,
        },
      ]);
    }
    setSelectedOp(null);
    setCanvasAction({
      type: 'update-canvas-node',
      data: { id: opNodeData.id, type: OPERATION_NODE },
    });
    setShowFunctionsList(false);
    panelOpFormState.current = 'edit';
  };

  const panelState = selectedOp
    ? 'op-form'
    : showFunctionsList || canvasNode?.type === SRC_MODEL_NODE
    ? 'op-list'
    : 'create-table-or-add-function';

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
          ref={contentRef}
          sx={{
            flex: '1 1 auto',
            overflowY: 'auto',
          }}
        >
          {panelState === 'op-form' ? (
            <OperationForm
              sx={{}}
              operation={selectedOp ? selectedOp : { slug: '', label: '' }}
              node={canvasNode}
              continueOperationChain={prepareForNextOperation}
              clearAndClosePanel={handleClosePanel}
              dummyNodeId={dummyNodeIdRef.current || ''}
              action={panelOpFormState.current}
            />
          ) : panelState === 'op-list' ? (
            <OperationList
              sx={{
                marginTop: '5px',
              }}
            />
          ) : (
            <CreateTableOrAddFunction
              clickCreateTable={handleCreateTable}
              clickAddFunction={handleAddFunction}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OperationConfigLayout;

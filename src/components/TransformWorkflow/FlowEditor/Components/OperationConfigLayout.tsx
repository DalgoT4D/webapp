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
  FLATTEN_JSON_OP,
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
import { Edge, useReactFlow } from 'reactflow';
import JoinOpForm from './OperationPanel/Forms/JoinOpForm';
import ReplaceValueOpForm from './OperationPanel/Forms/ReplaceValueOpForm';
import CoalesceOpForm from './OperationPanel/Forms/CoalesceOpForm';
import ArithmeticOpForm from './OperationPanel/Forms/ArithmeticOpForm';
import AggregationOpForm from './OperationPanel/Forms/AggregationOpForm';
import GroupByOpForm from './OperationPanel/Forms/GroupByOpForm';
import WhereFilterOpForm from './OperationPanel/Forms/WhereFilterOpForm';
import CaseWhenOpForm from './OperationPanel/Forms/CaseWhenOpForm';
import UnionTablesOpForm from './OperationPanel/Forms/UnionTablesOpForm';
import FlattenJsonOpForm from './OperationPanel/Forms/FlattenJsonOpForm';
import { generateDummyOperationlNode } from './dummynodes';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';

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
  [RENAME_COLUMNS_OP]: RenameColumnOpForm,
  [JOIN_OP]: JoinOpForm,
  [REPLACE_COLUMN_VALUE_OP]: ReplaceValueOpForm,
  [COALESCE_COLUMNS_OP]: CoalesceOpForm,
  [ARITHMETIC_OP]: ArithmeticOpForm,
  [DROP_COLUMNS_OP]: DropColumnOpForm,
  [CAST_DATA_TYPES_OP]: CastColumnOpForm,
  [AGGREGATE_OP]: AggregationOpForm,
  [GROUPBY_OP]: GroupByOpForm,
  [WHERE_OP]: WhereFilterOpForm,
  [CASEWHEN_OP]: CaseWhenOpForm,
  [UNION_OP]: UnionTablesOpForm,
  [FLATTEN_JSON_OP]: FlattenJsonOpForm,
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

  const Form = operationComponentMapping[operation.slug];
  const FormProps = {
    operation,
    node,
    sx,
    continueOperationChain,
    clearAndClosePanel,
    dummyNodeId,
    action,
  };

  return <Form {...FormProps} />;
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
  const dummyNodeIdRef: any = useRef(null);
  const contentRef: any = useRef(null);
  const panelOpFormState = useRef<'create' | 'view' | 'edit'>('view');

  const { addEdges, addNodes, deleteElements, getNodes, setNodes, getEdges } =
    useReactFlow();

  const handleClosePanel = () => {
    const dummyNodesArr: { id: string }[] = getNodes()
      .filter((node) => node.data.isDummy)
      .map((node) => ({ id: node.id }));
    dummyNodesArr.push({ id: dummyNodeIdRef.current });
    deleteElements({ nodes: dummyNodesArr });
    setOpenPanel(false);
    setShowFunctionsList(false);
    setSelectedOp(null);
    setCanvasNode(null);
  };

  const handleSelectOp = (op: UIOperationType) => {
    // Create the dummy node on canvas
    // For multi input operation we might have to do it inside the operation once they select the other inputs
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

    // unselect all nodes
    setNodes(
      getNodes().map((node) => {
        if (node.selected) {
          node.selected = false;
        }
        return node;
      })
    );
    addNodes([dummyTargetNodeData]);
    addEdges([newEdge]);

    setSelectedOp(op);
  };

  useEffect(() => {
    if (canvasAction.type === 'open-opconfig-panel') {
      setOpenPanel(true);
      setSelectedOp(null);
      console.log('here panel op form state', panelOpFormState.current);
      console.log('here canvas action data', canvasAction.data);
      panelOpFormState.current = canvasAction.data || 'view';
      if (['view', 'edit'].includes(panelOpFormState.current)) {
        const selectOp = canvasNode?.data as OperationNodeData;
        setSelectedOp(
          operations.find((op) => op.slug === selectOp.config?.type)
        );
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
        const dummyNodeIds: string[] = [dummyNodeIdRef.current];
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
      const { config } = canvasNode?.data as OperationNodeData;
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
              <InfoTooltip
                title={
                  selectedOp && selectedOp.slug === AGGREGATE_OP
                    ? 'Performs a calculation on multiple values in a column and returns a new column with that value in every row'
                    : selectedOp && selectedOp.slug === ARITHMETIC_OP
                    ? 'Perform arithmetic operations on or between one or more columns'
                    : selectedOp && selectedOp.slug === CASEWHEN_OP
                    ? 'Select the relevant column, operation, and comparison column or value'
                    : selectedOp && selectedOp.slug === CAST_DATA_TYPES_OP
                    ? "Convert a column's values (of any type) into a specified datatype"
                    : selectedOp && selectedOp.slug === COALESCE_COLUMNS_OP
                    ? 'Reads columns in the order selected and returns the first non-NULL value from a series of columns'
                    : selectedOp && selectedOp.slug === DROP_COLUMNS_OP
                    ? 'Select the columns that you would like to remove from the table'
                    : selectedOp && selectedOp.slug === WHERE_OP
                    ? 'Filters all the row values in the selected column based on the defined condition'
                    : selectedOp && selectedOp.slug === FLATTEN_JSON_OP
                    ? 'Transforms JSON formatted data into Tablular formatted data'
                    : selectedOp && selectedOp.slug === GROUPBY_OP
                    ? 'Group your data by one or more dimensions and analyse it'
                    : selectedOp && selectedOp.slug === JOIN_OP
                    ? 'Combine rows from two or more tables, based on a related (key) column between them'
                    : selectedOp && selectedOp.slug === RENAME_COLUMNS_OP
                    ? 'Select columns and rename them'
                    : selectedOp && selectedOp.slug === REPLACE_COLUMN_VALUE_OP
                    ? 'Replace all the row values in a column having a specified string with a new value'
                    : selectedOp && selectedOp.slug === UNION_OP
                    ? 'Combine data for matching columns across two datasets'
                    : selectedOp && selectedOp.label === 'Create Output Table'
                    ? 'Generate a table which will be saved with a new name in your desired warehouse schema'
                    : 'Select a function to learn how you can use it to transform your data'
                }
              />
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

  const OperationList = ({ sx }: { sx: SxProps }) => {
    // These are the operations that can't be chained
    const cantChainOperationsInMiddle: string[] = [
      UNION_OP,
      CAST_DATA_TYPES_OP,
      FLATTEN_JSON_OP,
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
              <Tooltip
                title={
                  canSelectOperation
                    ? ''
                    : 'Please create a table to use this function'
                }
                placement="top"
                disableHoverListener={canSelectOperation}
              >
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
                  {op.label}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>
    );
  };

  const handleCreateTable = async () => {
    setSelectedOp({ slug: 'create-table', label: 'Create Output Table' });
  };

  const handleAddFunction = () => {
    setShowFunctionsList(true);
    panelOpFormState.current = 'create';
  };

  const prepareForNextOperation = async (opNodeData: OperationNodeData) => {
    if (opNodeData.id !== canvasNode?.id) {
      const dummyNodeId: string = dummyNodeIdRef.current;
      // get all edges of this dummy node and save
      const dummyNodeEdges = getEdges().filter(
        (edge: Edge) =>
          edge.source === dummyNodeId || edge.target === dummyNodeId
      );

      // convert this dummy node to a real node from backend. basically create a new one
      const { x: xnew, y: ynew } = getNextNodePosition([
        {
          position: { x: canvasNode?.xPos, y: canvasNode?.yPos },
          height: 200,
        },
      ]);
      const dummyToRealNode = {
        id: opNodeData.id,
        type: OPERATION_NODE,
        data: opNodeData,
        position: { x: xnew, y: ynew },
      };

      // recreate the saved edges but this time to the real node
      const edgesToCreate: Edge[] = dummyNodeEdges.map((edge: Edge) => {
        const source =
          edge.source === dummyNodeId ? dummyToRealNode.id : edge.source;

        const target =
          edge.target === dummyNodeId ? dummyToRealNode.id : edge.target;

        return {
          id: `${source}_${target}`,
          source: source,
          target: target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        };
      });

      addNodes([dummyToRealNode]);
      addEdges(edgesToCreate);
    }
    deleteElements({
      nodes: [{ id: dummyNodeIdRef.current }],
    });
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

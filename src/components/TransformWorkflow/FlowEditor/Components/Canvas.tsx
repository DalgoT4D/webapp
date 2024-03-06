import Dagre from '@dagrejs/dagre';
import { Box, Button, Divider, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  // applyEdgeChanges,
  // applyNodeChanges,
  // addEdge,
  useNodesState,
  Controls,
  Background,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  ControlButton,
  // Node,
  Edge,
  useEdgesState,
  // useReactFlow,
  MarkerType,
  NodeTypes,
  NodeProps,
  EdgeMarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DbtSourceModel } from '../FlowEditor';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';
import { OperationNode } from './Nodes/OperationNode';
import { DbtSourceModelNode } from './Nodes/DbtSourceModelNode';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { TASK_DBTDEPS, TASK_DBTRUN } from '@/config/constant';
import OperationConfigLayout from './OperationConfigLayout';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../constant';

type CanvasProps = {
  redrawGraph: boolean;
  setRedrawGraph: (...args: any) => void;
};

export interface OperationNodeData {
  id: string;
  output_cols: Array<string>;
  type: typeof OPERATION_NODE;
  target_model_id: string;
  config?: any;
}

export interface OperationNodeType extends NodeProps {
  data: {
    node: OperationNodeData;
    triggerDelete: (...args: any) => void;
    triggerPreview: (...args: any) => void;
    triggerSelectOperation: (
      operation: { slug: string; label: string },
      node: OperationNodeType | SrcModelNodeType
    ) => void;
  };
}

export interface SrcModelNodeType extends NodeProps {
  data: {
    node: DbtSourceModel;
    triggerDelete: (...args: any) => void;
    triggerPreview: (...args: any) => void;
    triggerSelectOperation: (
      operation: { slug: string; label: string },
      node: OperationNodeType | SrcModelNodeType
    ) => void;
  };
}

type CustomNode = OperationNodeType | SrcModelNodeType;

type EdgeData = {
  id: string;
  source: string;
  target: string;
};

type DbtProjectGraphApiResponse = {
  nodes: Array<DbtSourceModel | OperationNodeData>;
  edges: EdgeData[];
};

type EdgeStyleProps = {
  markerEnd?: EdgeMarkerType;
  markerStart?: EdgeMarkerType;
};

export interface UIOperationType {
  slug: string;
  label: string;
}

const nodeTypes: NodeTypes = {
  [`${SRC_MODEL_NODE}`]: DbtSourceModelNode,
  [`${OPERATION_NODE}`]: OperationNode,
};

const CanvasHeader = ({
  runWorkflow,
}: {
  runWorkflow: (...args: any) => void;
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        flexDirection: 'space-between',
        justifyContent: 'center',
        padding: '0 20px',
        gap: '10px',
      }}
    >
      <Typography variant="h6" sx={{ marginLeft: 'auto' }}>
        Workflow01
      </Typography>

      <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '20px' }}>
        <Button variant="contained" type="button" onClick={runWorkflow}>
          Run
        </Button>
        <Button
          variant="contained"
          type="button"
          onClick={() => alert('Not sure what this will do')}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = ({
  nodes,
  edges,
  options,
}: {
  nodes: CustomNode[];
  edges: Edge[];
  options: { direction: string };
}) => {
  g.setGraph({
    rankdir: options.direction,
    nodesep: 200,
    edgesep: 100,
    width: 250,
    height: 120,
    marginx: 100,
    marginy: 100,
    ranksep: 350,
  });

  edges.forEach((edge: Edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node: CustomNode) => g.setNode(node.id, {}));

  // build the layout
  Dagre.layout(g);

  return {
    nodes: nodes.map((node: CustomNode) => {
      const { x, y } = g.node(node.id);

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const Canvas = ({ redrawGraph, setRedrawGraph }: CanvasProps) => {
  const { data: session } = useSession();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [openOperationConfig, setOpenOperationConfig] =
    useState<boolean>(false);
  const [nodeSelectedForConfig, setNodeSelectedForConfig] = useState<
    SrcModelNodeType | OperationNodeType | null
  >(null);
  const [operationSelectedForConfig, setOperationSelectedForConfig] = useState<{
    slug: string;
    label: string;
  } | null>(null);
  const previewNodeRef = useRef<DbtSourceModel | null>();
  const flowEditorContext = useContext(FlowEditorContext);
  const globalContext = useContext(GlobalContext);
  const EdgeStyle: EdgeStyleProps = {
    markerEnd: {
      type: MarkerType.Arrow,
      width: 20,
      height: 20,
      color: 'black',
    },
  };

  const fetchDbtProjectGraph = async () => {
    try {
      const response: DbtProjectGraphApiResponse = await httpGet(
        session,
        'transform/dbt_project/graph/'
      );
      const nodes: Array<DbtSourceModel | OperationNodeData | any> =
        response.nodes.map((nn: DbtSourceModel | OperationNodeData) => ({
          id: nn.id,
          type: nn.type,
          data: {
            node: nn,
            triggerDelete: handleDeleteNode,
            triggerPreview: handlePreviewDataForNode,
            triggerSelectOperation: handleSelectOperation,
          },
        }));
      const edges: Edge[] = response.edges.map((edgeData: EdgeData) => ({
        ...edgeData,
        ...EdgeStyle,
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements({
          nodes: nodes,
          edges: edges,
          options: { direction: 'LR' },
        });

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (session) fetchDbtProjectGraph();
  }, [session, redrawGraph]);

  useEffect(() => {
    previewNodeRef.current = flowEditorContext?.previewNode.state.node;
  }, [flowEditorContext?.previewNode.state]);

  const handleNodesChange = (changes: NodeChange[]) => {
    console.log(
      'inside handle nodes changes; changes include move, drag and select'
    );
    console.log('node changes', changes);
    onNodesChange(changes);
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    console.log(
      'inside handle edges changes; changes include select and remove'
    );
    onEdgesChange(changes);
  };

  const handleNewConnection = (connection: Connection) => {
    console.log(
      'inside handle new connection; when two nodes are connected by user',
      connection
    );
    if (connection.source && connection.target) {
      const newEdge: Edge = {
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
        id: `${connection.source}_${connection.target}`,
        ...EdgeStyle,
      };
      handleEdgesChange([{ type: 'add', item: newEdge }]);
    }
  };

  const handleDeleteNode = async (nodeId: string, type: string) => {
    console.log('deleting a node with id ', nodeId);
    // remove the node from preview if its there
    console.log('compare with', previewNodeRef.current?.id);
    if (nodeId === previewNodeRef.current?.id) {
      flowEditorContext?.previewNode.dispatch({
        type: 'clear-preview',
        state: {
          node: null,
        },
      });
    }

    // remove node from canvas
    if (type === SRC_MODEL_NODE) {
      // hit the backend api to remove the node in a try catch
      try {
        await httpDelete(session, `transform/dbt_project/model/${nodeId}/`);
        setRedrawGraph(!redrawGraph);
      } catch (error) {
        console.log(error);
      }
    } else if (type === OPERATION_NODE) {
      // hit the backend api to remove the node in a try catch
      try {
        await httpDelete(
          session,
          `transform/dbt_project/model/operations/${nodeId}/`
        );
        setRedrawGraph(!redrawGraph);
      } catch (error) {
        console.log(error);
      }
    }

    handleNodesChange([{ type: 'remove', id: nodeId }]);
  };

  const handlePreviewDataForNode = (sourceModel: DbtSourceModel | null) => {
    if (sourceModel) {
      flowEditorContext?.previewNode.dispatch({
        type: 'preview',
        state: {
          node: sourceModel,
          action: 'preview',
        },
      });
    }
  };

  const handleSelectOperation = (
    operation: UIOperationType,
    node: OperationNodeType | SrcModelNodeType
  ) => {
    console.log('node to be sent to operation config compoentn', node);
    setOperationSelectedForConfig(operation);
    setNodeSelectedForConfig(node);
    setOpenOperationConfig(true);
  };

  const addNewNodeToCanvas = (
    dbtSourceModel: DbtSourceModel | null | undefined
  ) => {
    if (dbtSourceModel) {
      console.log('adding a source or a model to canvas', dbtSourceModel);
      const newNode = {
        id: dbtSourceModel.id,
        type: SRC_MODEL_NODE,
        data: {
          triggerDelete: handleDeleteNode,
          triggerPreview: handlePreviewDataForNode,
          triggerSelectOperation: handleSelectOperation,
          node: dbtSourceModel,
        },
        position: { x: 100, y: 125 },
      };
      handleNodesChange([{ type: 'add', item: newNode }]);
    }
  };

  useEffect(() => {
    // This event is triggered via the ProjectTree component
    if (flowEditorContext?.canvasNode.state.action === 'add') {
      addNewNodeToCanvas(flowEditorContext?.canvasNode.state.node);
    }

    if (flowEditorContext?.canvasNode.state.action === 'refresh-canvas') {
      setRedrawGraph(!redrawGraph);
      setOperationSelectedForConfig(null);
      setOpenOperationConfig(false);
    }
  }, [flowEditorContext?.canvasNode.state]);

  const handleRunWorkflow = async () => {
    console.log('running the workflow');
    try {
      const tasks: any = await httpGet(session, `prefect/tasks/transform/`);

      const dbtDepsTask = tasks.find((task: any) => task.slug === TASK_DBTDEPS);

      if (dbtDepsTask) {
        successToast('Installing dependencies', [], globalContext);
        await httpPost(session, `prefect/tasks/${dbtDepsTask.uuid}/run/`, {});
      }

      const dbtRunTask = tasks.find((task: any) => task.slug === TASK_DBTRUN);

      if (dbtRunTask) {
        await httpPost(
          session,
          `prefect/v1/flows/${dbtRunTask.deploymentId}/flow_run/`,
          {}
        );
        successToast('Dbt run initiated', [], globalContext);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ height: '10%', background: 'lightgrey' }}>
        <CanvasHeader runWorkflow={handleRunWorkflow} />
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box sx={{ display: 'flex', height: '90%' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleNewConnection}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            defaultViewport={defaultViewport}
            fitView
          >
            <Background />
            <Controls>
              <ControlButton
                onClick={() => {
                  successToast('Graph has been refreshed', [], globalContext);
                  setRedrawGraph(!redrawGraph);
                }}
              >
                <ReplayIcon />
              </ControlButton>
            </Controls>
          </ReactFlow>
        </ReactFlowProvider>
        <OperationConfigLayout
          openConfigPanel={openOperationConfig}
          setOpenConfigPanel={setOpenOperationConfig}
          operation={operationSelectedForConfig}
          node={nodeSelectedForConfig}
          sx={{
            background: '#FFFFFF',
            justifyContent: 'flex-end',
            width: '500px',
            boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.16)',
            borderRadius: '6px 0px 0px 6px',
            overflowY: 'auto',
          }}
        />
      </Box>
    </Box>
  );
};

export default Canvas;

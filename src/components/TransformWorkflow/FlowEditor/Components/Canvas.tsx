import Dagre from '@dagrejs/dagre';
import { Box, Button, Divider, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  useNodesState,
  Controls,
  Background,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  ControlButton,
  Node,
  Edge,
  useEdgesState,
  useReactFlow,
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
import { set } from 'cypress/types/lodash';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { TASK_DBTRUN } from '@/config/constant';

type CanvasProps = {};

interface OperationNodeData {
  id: string;
  output_cols: Array<string>;
  type: 'operation_node';
  config?: any;
}

export interface OperationNodeType extends NodeProps {
  data: {
    node: OperationNodeData;
    triggerDelete: (...args: any) => void;
    triggerPreview: (...args: any) => void;
  };
}

export interface SrcModelNodeType extends NodeProps {
  data: {
    node: DbtSourceModel;
    triggerDelete: (...args: any) => void;
    triggerPreview: (...args: any) => void;
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

const nodeTypes: NodeTypes = {
  src_model_node: DbtSourceModelNode,
  operation_node: OperationNode,
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
    nodesep: 2000,
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

const Canvas = ({}: CanvasProps) => {
  const { data: session } = useSession();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [redrawGraph, setRedrawGraph] = useState<boolean>(false);
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
    if (type === 'src_model_node') {
      // hit the backend api to remove the node in a try catch
      try {
        await httpDelete(session, `transform/dbt_project/model/${nodeId}/`);
        setRedrawGraph(!redrawGraph);
      } catch (error) {
        console.log(error);
      }
    } else if (type === 'operation_node') {
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

  const addNewNodeToCanvas = (
    dbtSourceModel: DbtSourceModel | null | undefined
  ) => {
    if (dbtSourceModel) {
      console.log('adding a source or a model to canvas', dbtSourceModel);
      const newNode = {
        id: dbtSourceModel.id,
        type: 'src_model_node',
        data: {
          triggerDelete: handleDeleteNode,
          triggerPreview: handlePreviewDataForNode,
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
  }, [flowEditorContext?.canvasNode.state]);

  const handleRunWorkflow = async () => {
    console.log('running the workflow');
    try {
      const tasks: any = await httpGet(session, `prefect/tasks/transform/`);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: '10%', background: 'lightgrey' }}>
        <CanvasHeader runWorkflow={handleRunWorkflow} />
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box sx={{ height: '90%' }}>
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
      </Box>
    </Box>
  );
};

export default Canvas;

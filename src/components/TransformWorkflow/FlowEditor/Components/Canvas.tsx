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
import { OperationNode } from './Nodes/OperationNode';
import { DbtSourceModelNode } from './Nodes/DbtSourceModelNode';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { TASK_DBTDEPS, TASK_DBTRUN } from '@/config/constant';
import OperationConfigLayout from './OperationConfigLayout';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../constant';
import { delay } from '@/utils/common';
import { PrefectFlowRun, PrefectFlowRunLog } from '@/components/DBT/DBTTarget';
import { useDbtRunLogsUpdate } from '@/contexts/DbtRunLogsContext';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';

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

export type DbtSourceModel = {
  source_name: string;
  input_name: string;
  input_type: 'model' | 'source';
  schema: string;
  id: string;
  type: typeof SRC_MODEL_NODE;
};

export interface OperationNodeType extends NodeProps {
  data: OperationNodeData;
}

export interface SrcModelNodeType extends NodeProps {
  data: DbtSourceModel;
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
  const { canvasNode, setCanvasNode } = useCanvasNode();

  const [operationSelectedForConfig, setOperationSelectedForConfig] = useState<{
    slug: string;
    label: string;
  } | null>(null);
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { previewAction, setPreviewAction } = usePreviewAction();
  const previewNodeRef = useRef<DbtSourceModel | null>();
  const globalContext = useContext(GlobalContext);
  const EdgeStyle: EdgeStyleProps = {
    markerEnd: {
      type: MarkerType.Arrow,
      width: 20,
      height: 20,
      color: 'black',
    },
  };
  const setDbtRunLogs = useDbtRunLogsUpdate();

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
          data: nn,
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
    previewNodeRef.current = previewAction.data;
  }, [previewAction]);

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
    // console.log('compare with', previewNodeRef.current?.id);
    // if (nodeId === previewNodeRef.current?.id) {
    //   setPreviewAction({ type: 'clear-preview', data: null });
    // }

    // remove node from canvas
    if (type === SRC_MODEL_NODE) {
      // hit the backend api to remove the node in a try catch
      try {
        await httpDelete(session, `transform/dbt_project/model/${nodeId}/`);
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
      } catch (error) {
        console.log(error);
      }
    }

    handleNodesChange([{ type: 'remove', id: nodeId }]);
    setRedrawGraph(!redrawGraph);
  };

  const addNewNodeToCanvas = (
    dbtSourceModel: DbtSourceModel | null | undefined
  ) => {
    if (dbtSourceModel) {
      console.log('adding a source or a model to canvas', dbtSourceModel);
      const newNode = {
        id: dbtSourceModel.id,
        type: SRC_MODEL_NODE,
        data: dbtSourceModel,
        position: { x: 100, y: 125 },
      };
      handleNodesChange([{ type: 'add', item: newNode }]);
    }
  };

  const handleRefreshCanvas = () => {
    setRedrawGraph(!redrawGraph);
    setOperationSelectedForConfig(null);
  };

  useEffect(() => {
    // This event is triggered via the ProjectTree component
    if (canvasAction.type === 'add') {
      addNewNodeToCanvas(canvasAction.data);
    }

    if (canvasAction.type === 'refresh-canvas') {
      handleRefreshCanvas();
    }

    if (canvasAction.type === 'delete-node') {
      handleDeleteNode(canvasAction.data.nodeId, canvasAction.data.nodeType);
    }

    if (canvasAction.type === 'open-opconfig-panel') {
      setOpenOperationConfig(true);
    }

    if (canvasAction.type === 'run-workflow') {
      handleRunWorkflow();
    }
  }, [canvasAction]);

  const fetchFlowRunStatus = async (flow_run_id: string) => {
    try {
      const flowRun: PrefectFlowRun = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}`
      );

      if (!flowRun.state_type) return 'FAILED';

      return flowRun.state_type;
    } catch (err: any) {
      console.error(err);
      return 'FAILED';
    }
  };

  const fetchAndSetFlowRunLogs = async (flow_run_id: string) => {
    try {
      const response = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}/logs`
      );
      if (response?.logs?.logs && response.logs.logs.length > 0) {
        const logsArray: PrefectFlowRunLog[] = response.logs.logs.map(
          // eslint-disable-next-line
          (logObject: PrefectFlowRunLog, idx: number) => logObject
        );

        setDbtRunLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

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
        const response = await httpPost(
          session,
          `prefect/v1/flows/${dbtRunTask.deploymentId}/flow_run/`,
          {}
        );
        successToast('Dbt run initiated', [], globalContext);
        let flowRunStatus: string = await fetchFlowRunStatus(
          response.flow_run_id
        );
        await fetchAndSetFlowRunLogs(response.flow_run_id);
        while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
          await delay(5000);
          await fetchAndSetFlowRunLogs(response.flow_run_id);
          flowRunStatus = await fetchFlowRunStatus(response.flow_run_id);
        }
        handleRefreshCanvas();
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
          openPanel={openOperationConfig}
          setOpenPanel={setOpenOperationConfig}
          sx={{
            background: '#FFFFFF',
            width: '500px',
            boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.16)',
            borderRadius: '6px 0px 0px 6px',
            zIndex: 1000,
          }}
        />
      </Box>
    </Box>
  );
};

export default Canvas;

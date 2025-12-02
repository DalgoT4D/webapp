import Dagre from '@dagrejs/dagre';
import {
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  useNodesState,
  Controls,
  Background,
  NodeChange,
  EdgeChange,
  Connection,
  ControlButton,
  Edge,
  useEdgesState,
  MarkerType,
  NodeTypes,
  NodeProps,
  EdgeMarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { OperationNode } from './Nodes/OperationNode';
import { DbtSourceModelNode } from './Nodes/DbtSourceModelNode';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { successToast, errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import OperationConfigLayout from './OperationConfigLayout';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { getNextNodePosition } from '@/utils/editor';
import { KeyboardArrowDown } from '@mui/icons-material';
import { useTracking } from '@/contexts/TrackingContext';
import {
  CanvasEdgeDataResponse,
  CanvasNodeDataResponse,
  CanvasNodeRender,
  DbtProjectGraphApiResponse,
  CanvasNodeTypeEnum,
  CanvasNodeRenderData,
  DbtModelResponse,
} from '@/types/transform-v2.types';

type CanvasProps = {
  redrawGraph: boolean;
  setRedrawGraph: (...args: any) => void;
  finalLockCanvas: boolean;
  setTempLockCanvas: any;
};

const nodeGap = 30;

export type OperationNodeType = NodeProps<CanvasNodeRender>;

export type SrcModelNodeType = NodeProps<CanvasNodeRender>;

type EdgeStyleProps = {
  markerEnd?: EdgeMarkerType;
  markerStart?: EdgeMarkerType;
};

export interface UIOperationType {
  slug: string;
  label: string;
  infoToolTip?: string;
}

const nodeTypes: NodeTypes = {
  [CanvasNodeTypeEnum.Model]: DbtSourceModelNode,
  [CanvasNodeTypeEnum.Source]: DbtSourceModelNode,
  [CanvasNodeTypeEnum.Operation]: OperationNode,
};

const WorkflowValues: any = {
  run: 'Run workflow',
  'run-to-node': 'Run to node',
  'run-from-node': 'Run from node',
};

const CanvasHeader = ({ finalLockCanvas }: { finalLockCanvas: boolean }) => {
  const { setCanvasAction } = useCanvasAction();
  const { canvasNode } = useCanvasNode();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const [selectedAction, setSelectedAction] = useState('');
  const trackAmplitudeEvent: any = useTracking();
  const nodeData: any = canvasNode?.data;

  const handleRunClick = (event: any) => {
    const action = event.target.value;
    setSelectedAction(action);
    trackAmplitudeEvent(`[${WorkflowValues[action]}] Button Clicked`);
    if (action === 'run') {
      setCanvasAction({ type: 'run-workflow', data: null });
    } else if (action === 'run-to-node') {
      setCanvasAction({
        type: 'run-workflow',
        data: { options: { select: `+${nodeData?.input_name}` } },
      });
    } else if (action === 'run-from-node') {
      setCanvasAction({
        type: 'run-workflow',
        data: { options: { select: `${nodeData?.input_name}+` } },
      });
    }
  };

  const disableToAndFromNodeRunOptions =
    !canvasNode ||
    ![CanvasNodeTypeEnum.Source.toString(), CanvasNodeTypeEnum.Model.toString()].includes(
      canvasNode?.type
    );

  useEffect(() => {
    if (!finalLockCanvas) {
      setSelectedAction('');
    }
  }, [finalLockCanvas]);
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

      <Box
        sx={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '20px',
          minWidth: '30%',
          justifyContent: 'flex-end',
        }}
      >
        {' '}
        <Select
          labelId="run-workflow-action"
          value={selectedAction}
          onChange={handleRunClick}
          label="Action"
          disabled={!permissions.includes('can_run_pipeline')}
          displayEmpty
          placeholder="Select Action"
          renderValue={(value) => {
            return value === '' ? 'Select Action' : WorkflowValues[value];
          }}
          IconComponent={(props: any) => {
            return <KeyboardArrowDown {...props} style={{ color: '#FFFFFF', width: '21px' }} />;
          }}
          sx={{
            background: '#00897B',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '12px',
            border: '1px solid #00897B',
            borderRadius: '6px',
            minWidth: '7rem',
            height: '1.688rem',
            textAlign: 'center',
            boxShadow: '0px 2px 4px 0px ',
          }}
        >
          <MenuItem value="run">Run workflow</MenuItem>
          <MenuItem value="run-to-node" disabled={disableToAndFromNodeRunOptions}>
            Run to node
          </MenuItem>
          <MenuItem value="run-from-node" disabled={disableToAndFromNodeRunOptions}>
            Run from node
          </MenuItem>
        </Select>
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
  nodes: CanvasNodeRender[];
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
  nodes.forEach((node: CanvasNodeRender) => g.setNode(node.id, {}));

  // build the layout
  Dagre.layout(g);

  return {
    nodes: nodes.map((node: CanvasNodeRender) => {
      const { x, y } = g.node(node.id);

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const Canvas = ({
  redrawGraph,
  setRedrawGraph,
  finalLockCanvas,
  setTempLockCanvas,
}: CanvasProps) => {
  const { data: session } = useSession();
  const [nodes, setNodes, onNodesChange] = useNodesState([]); //works when we click the node or move it.
  const [edges, setEdges, onEdgesChange] = useEdgesState([]); //workds when we click the edges.
  const [openOperationConfig, setOpenOperationConfig] = useState<boolean>(false); // this is the right form with sql operations.
  const { addNodes, setCenter, getZoom } = useReactFlow();

  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode } = useCanvasNode();
  const { previewAction, setPreviewAction } = usePreviewAction();
  const previewNodeRef = useRef<CanvasNodeRenderData | null>();
  const globalContext = useContext(GlobalContext);
  const EdgeStyle: EdgeStyleProps = {
    markerEnd: {
      type: MarkerType.Arrow,
      width: 20,
      height: 20,
      color: 'black',
    },
  };
  // const [tempLockCanvas, setTempLockCanvas] = useState(true);
  // const finalLockCanvas = tempLockCanvas || lockUpperSection;
  const fetchDbtProjectGraph = async () => {
    setTempLockCanvas(true);
    try {
      const response: DbtProjectGraphApiResponse = await httpGet(
        session,
        'transform/v2/dbt_project/graph/'
      );
      const nodes: CanvasNodeRender[] = response.nodes.map((nn: CanvasNodeDataResponse) => ({
        id: nn.uuid,
        type: nn.node_type,
        data: { ...nn, isDummy: false },
        position: { x: 0, y: 0 }, // we will update it below after layouting
      }));
      const edges: Edge[] = response.edges.map((edgeData: CanvasEdgeDataResponse) => ({
        ...edgeData,
        ...EdgeStyle,
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements({
        nodes: nodes,
        edges: edges,
        options: { direction: 'LR' },
      });

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    } catch (error) {
      console.log(error);
    } finally {
      // setLockUpperSection(false);
      setTempLockCanvas(false);
    }
  };

  useEffect(() => {
    setTempLockCanvas(true);
    if (session) {
      fetchDbtProjectGraph();
    }
  }, [session, redrawGraph]);

  useEffect(() => {
    previewNodeRef.current = previewAction.data;
  }, [previewAction]);

  const handleNodesChange = (changes: NodeChange[]) => {
    console.log('inside handle nodes changes; changes include move, drag and select');
    console.log('node changes', changes);
    onNodesChange(changes);
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    console.log('inside handle edges changes; changes include select and remove');
    onEdgesChange(changes);
  };

  const handleNewConnection = (connection: Connection) => {
    console.log('inside handle new connection; when two nodes are connected by user', connection);
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

  const handleDeleteNode = async (
    nodeId: string,
    type: string,
    shouldRefreshGraph = true,
    isDummy = false
  ) => {
    console.log('deleting a node with id ', nodeId);
    // remove the node from preview if its there
    if (!isDummy) {
      // remove node from canvas - unified delete endpoint in v2
      try {
        await httpDelete(session, `transform/v2/dbt_project/nodes/${nodeId}/`);
      } catch (error) {
        console.log(error);
      } finally {
        setTempLockCanvas(false);
      }
    }

    handleNodesChange([{ type: 'remove', id: nodeId }]);
    if (nodeId === canvasNode?.id || isDummy) {
      setCanvasAction({
        type: 'close-reset-opconfig-panel',
        data: null,
      });
    }

    if (shouldRefreshGraph) setRedrawGraph(!redrawGraph); //calls api in parent and this comp rerenders.
  };

  const handleDeleteSourceTreeNode = async (
    nodeId: string,
    type: string,
    shouldRefreshGraph = true,
    isDummy = false
  ) => {
    console.log('delete source node');
    try {
      if (
        [CanvasNodeTypeEnum.Model.toString(), CanvasNodeTypeEnum.Source.toString()].includes(
          type
        ) &&
        !isDummy
      )
        await httpDelete(session, `transform/v2/dbt_project/model/${nodeId}/`);
    } catch (error: any) {
      console.log(error);
      errorToast(error.message, [], globalContext);
    } finally {
      setTempLockCanvas(false);
    }

    if (shouldRefreshGraph) setRedrawGraph(!redrawGraph);
  };

  const addSrcModelNodeToCanvas = async (dbtSourceModel: DbtModelResponse | null | undefined) => {
    if (dbtSourceModel) {
      try {
        setTempLockCanvas(true);

        // Call v2 API to create CanvasNode in backend
        const canvasNode: CanvasNodeDataResponse = await httpPost(
          session,
          `transform/v2/dbt_project/models/${dbtSourceModel.uuid}/nodes/`,
          {} // Empty payload as the endpoint uses the dbtmodel_uuid from URL
        );

        // Add node to canvas using the response from backend
        const position = getNextNodePosition(nodes);
        const newNode: CanvasNodeRender = {
          id: canvasNode.uuid,
          type: canvasNode.node_type,
          data: { ...canvasNode, isDummy: false },
          position,
        };

        addNodes([newNode]);
        setCenter(position.x, position.y, {
          zoom: getZoom(),
          duration: 500,
        });
      } catch (error) {
        console.error('Failed to add source model to canvas:', error);
        // Optionally show error toast
      } finally {
        setTempLockCanvas(false);
      }
    }
  };

  // const handleRefreshCanvas = () => {
  //   setRedrawGraph(!redrawGraph);
  // };

  useEffect(() => {
    // This event is triggered via the ProjectTree component
    if (canvasAction.type === 'add-srcmodel-node') {
      addSrcModelNodeToCanvas(canvasAction.data);
    }

    // if (canvasAction.type === 'refresh-canvas') {
    //   setTempLockCanvas(true);
    //   handleRefreshCanvas();
    // }

    if (canvasAction.type === 'delete-node') {
      setTempLockCanvas(true);
      handleDeleteNode(
        canvasAction.data.nodeId,
        canvasAction.data.nodeType,
        canvasAction.data.shouldRefreshGraph, // by default always refresh canvas
        canvasAction.data.isDummy !== undefined ? canvasAction.data.isDummy : false
      );
    }

    if (canvasAction.type == 'delete-source-tree-node') {
      setTempLockCanvas(true);
      handleDeleteSourceTreeNode(
        canvasAction.data.nodeId,
        canvasAction.data.nodeType,
        canvasAction.data.shouldRefreshGraph, // by default always refresh canvas
        canvasAction.data.isDummy !== undefined ? canvasAction.data.isDummy : false
      );
    }
  }, [canvasAction]);

  const onNodeDragStop = (event: any, node: any) => {
    let x = node.position.x;
    let y = node.position.y;

    nodes.forEach((otherNode) => {
      if (otherNode.id === node.id) return;

      const xOverlap = Math.max(
        0,
        Math.min(node.position.x + node.width, otherNode.position.x + (otherNode.width || 0)) -
          Math.max(node.position.x, otherNode.position.x)
      );
      const yOverlap = Math.max(
        0,
        Math.min(node.position.y + node.height, otherNode.position.y + (otherNode.height || 0)) -
          Math.max(node.position.y, otherNode.position.y)
      );
      if (xOverlap > 0 && yOverlap > 0) {
        // Prevent overlap by adjusting position
        if (x < otherNode.position.x) {
          x -= xOverlap + nodeGap;
        } else {
          x += xOverlap + nodeGap;
        }

        if (y < otherNode.position.y) {
          y -= yOverlap + nodeGap;
        } else {
          y += yOverlap + nodeGap;
        }
      }
    });

    setNodes((nds) =>
      nds.map((nd) => {
        if (nd.id === node.id) {
          // Update the position of the node being dragged
          return {
            ...nd,
            position: {
              x,
              y,
            },
          };
        }
        return nd;
      })
    );
  };

  const handlePaneClick = () => {
    // clicking the background canvas.
    setCanvasAction({ type: 'close-reset-opconfig-panel', data: null });
    setPreviewAction({ type: 'clear-preview', data: null });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Backdrop
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          position: 'absolute', // Position the Backdrop over the Box
          top: 0,
          left: 0,
          right: 0,
          bottom: 0, // Cover the entire Box
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={finalLockCanvas}
        onClick={() => {}}
      >
        <CircularProgress
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />
      </Backdrop>
      <Box
        sx={{
          height: '44px',
          background: '#F5FAFA',
          borderTop: '1px #CCD6E2 solid',
        }}
      >
        <CanvasHeader finalLockCanvas={finalLockCanvas} />
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box
        sx={{
          display: 'flex',
          height: 'calc(100% - 44px)',
          background: 'white',
        }}
      >
        <ReactFlow
          nodes={nodes} // are the tables and the operations.
          selectNodesOnDrag={false}
          edges={edges} // flexible lines connecting tables, table-node.
          onNodeDragStop={onNodeDragStop}
          onPaneClick={handlePaneClick} //back canvas click.
          onNodesChange={handleNodesChange} // when node (table or operation) is clicked or moved.
          onEdgesChange={handleEdgesChange}
          onConnect={handleNewConnection}
          nodeTypes={nodeTypes}
          minZoom={0.1}
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
                setCanvasAction({
                  type: 'refresh-canvas',
                  data: null,
                });
              }}
            >
              <ReplayIcon />
            </ControlButton>
          </Controls>
        </ReactFlow>
        {/* This is what renders the right form */}
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

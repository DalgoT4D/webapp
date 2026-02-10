import Dagre from '@dagrejs/dagre';
import {
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  MenuItem,
  Typography,
  Button,
  Menu,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PublishIcon from '@mui/icons-material/Publish';
import LockIcon from '@mui/icons-material/Lock';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { httpDelete, httpGet, httpPost, httpPut } from '@/helpers/http';
import { successToast, errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import OperationConfigLayout from './OperationConfigLayout';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { getNextNodePosition } from '@/utils/editor';
import { KeyboardArrowDown } from '@mui/icons-material';
import { useTracking } from '@/contexts/TrackingContext';
import PublishModal from './PublishModal';
import CanvasMessages, { CanvasMessage } from './CanvasMessages';
import PatRequiredModal from './PatRequiredModal';
import NodeDetailModal from './NodeDetailModal';
import {
  CanvasEdgeDataResponse,
  CanvasNodeDataResponse,
  CanvasNodeRender,
  DbtProjectGraphApiResponse,
  CanvasNodeTypeEnum,
  CanvasNodeRenderData,
  DbtModelResponse,
  PreviewTableData,
} from '@/types/transform-v2.types';

type CanvasProps = {
  redrawGraph: boolean;
  setRedrawGraph: (...args: any) => void;
  finalLockCanvas: boolean;
  setTempLockCanvas: any;
  isPreviewMode?: boolean;
  isRunning?: boolean;
};

const nodeGap = 30;

export type OperationNodeType = NodeProps<CanvasNodeRender>;

export type SrcModelNodeType = NodeProps<CanvasNodeRender>;

type EdgeStyleProps = {
  type?: string;
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

const CanvasHeader = ({
  finalLockCanvas,
  canInteractWithCanvas,
  onPublishClick,
}: {
  finalLockCanvas: boolean;
  canInteractWithCanvas: () => boolean;
  onPublishClick: () => void;
}) => {
  const { setCanvasAction } = useCanvasAction();
  const { canvasNode } = useCanvasNode();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const [selectedAction, setSelectedAction] = useState('');
  const [runMenuAnchor, setRunMenuAnchor] = useState<null | HTMLElement>(null);
  const trackAmplitudeEvent: any = useTracking();
  const nodeData = canvasNode?.data;

  const handleDiscardChanges = () => {
    console.log('Discard Changes clicked');
    trackAmplitudeEvent('[Discard Changes] Button Clicked');
  };

  const handleRunClick = (event: React.MouseEvent<HTMLElement>) => {
    setRunMenuAnchor(event.currentTarget);
  };

  const handleRunMenuClose = () => {
    setRunMenuAnchor(null);
  };

  const handleRunAction = (action: string) => {
    setSelectedAction(action);
    trackAmplitudeEvent(`[${WorkflowValues[action]}] Button Clicked`);
    if (action === 'run') {
      setCanvasAction({ type: 'run-workflow', data: null });
    } else if (action === 'run-to-node') {
      setCanvasAction({
        type: 'run-workflow',
        data: { options: { select: `+${nodeData?.dbtmodel?.name}` } },
      });
    } else if (action === 'run-from-node') {
      setCanvasAction({
        type: 'run-workflow',
        data: { options: { select: `${nodeData?.dbtmodel?.name}+` } },
      });
    }
    handleRunMenuClose();
  };

  const handlePublish = () => {
    console.log('Publish clicked');
    trackAmplitudeEvent('[Publish] Button Clicked');
    onPublishClick();
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
        Workflow
      </Typography>

      <Box
        sx={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '10px',
          minWidth: '30%',
          justifyContent: 'flex-end',
        }}
      >
        {/* Discard Changes Button - Hidden for future release */}
        {/* <Button
          variant="contained"
          onClick={handleDiscardChanges}
          disabled={!canInteractWithCanvas()}
          startIcon={<ClearIcon />}
          sx={{
            background: canInteractWithCanvas() ? '#00897B' : '#ccc',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '12px',
            borderRadius: '6px',
            textTransform: 'none',
            minWidth: '120px',
            height: '32px',
            '&:hover': {
              background: canInteractWithCanvas() ? '#00695C' : '#ccc',
            },
            '&:disabled': {
              color: '#FFFFFF',
              opacity: 0.6,
            },
          }}
        >
          Discard Changes
        </Button> */}

        {/* Run Button with Dropdown */}
        <Button
          variant="contained"
          onClick={handleRunClick}
          disabled={!permissions.includes('can_run_pipeline') || !canInteractWithCanvas()}
          endIcon={<KeyboardArrowDown />}
          startIcon={<PlayArrowIcon />}
          sx={{
            background:
              permissions.includes('can_run_pipeline') && canInteractWithCanvas()
                ? '#00897B'
                : '#ccc',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '12px',
            borderRadius: '6px',
            textTransform: 'none',
            minWidth: '80px',
            height: '32px',
            '&:hover': {
              background:
                permissions.includes('can_run_pipeline') && canInteractWithCanvas()
                  ? '#00695C'
                  : '#ccc',
            },
            '&:disabled': {
              color: '#FFFFFF',
              opacity: 0.6,
            },
          }}
        >
          Run
        </Button>

        {/* Run Menu Dropdown */}
        <Menu
          anchorEl={runMenuAnchor}
          open={Boolean(runMenuAnchor)}
          onClose={handleRunMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleRunAction('run')}>Run workflow</MenuItem>
          <MenuItem
            onClick={() => handleRunAction('run-to-node')}
            disabled={disableToAndFromNodeRunOptions}
          >
            Run to node
          </MenuItem>
          <MenuItem
            onClick={() => handleRunAction('run-from-node')}
            disabled={disableToAndFromNodeRunOptions}
          >
            Run from node
          </MenuItem>
        </Menu>

        {/* Publish Button */}
        <Button
          variant="contained"
          onClick={handlePublish}
          disabled={!canInteractWithCanvas()}
          startIcon={<PublishIcon />}
          sx={{
            background: canInteractWithCanvas() ? '#00897B' : '#ccc',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '12px',
            borderRadius: '6px',
            textTransform: 'none',
            minWidth: '90px',
            height: '32px',
            '&:hover': {
              background: canInteractWithCanvas() ? '#00695C' : '#ccc',
            },
            '&:disabled': {
              color: '#FFFFFF',
              opacity: 0.6,
            },
          }}
        >
          Publish
        </Button>
      </Box>
    </Box>
  );
};

const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

type LayoutSpacing = { nodesep: number; ranksep: number };
const DEFAULT_SPACING: LayoutSpacing = { nodesep: 80, ranksep: 200 };

// Layout a single connected component with Dagre
const layoutComponent = (
  componentNodes: CanvasNodeRender[],
  componentEdges: Edge[],
  direction: string,
  spacing: LayoutSpacing = DEFAULT_SPACING
) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: spacing.nodesep,
    edgesep: 50,
    width: 160,
    height: 60,
    marginx: 20,
    marginy: 20,
    ranksep: spacing.ranksep,
  });

  componentEdges.forEach((edge: Edge) => g.setEdge(edge.source, edge.target));
  componentNodes.forEach((node: CanvasNodeRender) => g.setNode(node.id, {}));
  Dagre.layout(g);

  const positioned = componentNodes.map((node: CanvasNodeRender) => {
    const { x, y } = g.node(node.id);
    return { ...node, position: { x, y } };
  });

  // Compute bounding box of this component
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of positioned) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + 160);
    maxY = Math.max(maxY, n.position.y + 60);
  }

  return { nodes: positioned, width: maxX - minX, height: maxY - minY, minX, minY };
};

const getLayoutedElements = ({
  nodes,
  edges,
  options,
}: {
  nodes: CanvasNodeRender[];
  edges: Edge[];
  options: { direction: string; spacing?: LayoutSpacing };
}) => {
  if (nodes.length === 0) return { nodes, edges };

  const spacing = options.spacing || DEFAULT_SPACING;

  // Find connected components using Dagre's graphlib
  const g = new Dagre.graphlib.Graph();
  nodes.forEach((n) => g.setNode(n.id, {}));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  const components: string[][] = Dagre.graphlib.alg.components(g);

  // Sort: larger components first for better grid packing
  components.sort((a, b) => b.length - a.length);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Layout each component separately
  const layoutedComponents = components.map((nodeIds) => {
    const nodeIdSet = new Set(nodeIds);
    const compNodes = nodeIds.map((id) => nodeMap.get(id)!);
    const compEdges = edges.filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target));
    return layoutComponent(compNodes, compEdges, options.direction, spacing);
  });

  // Arrange components in a grid (fill horizontally, then wrap)
  const clusterGap = 100;
  const maxRowWidth = 2000;

  let cursorX = 0;
  let cursorY = 0;
  let rowMaxHeight = 0;
  const allNodes: CanvasNodeRender[] = [];

  for (const comp of layoutedComponents) {
    if (cursorX > 0 && cursorX + comp.width > maxRowWidth) {
      cursorY += rowMaxHeight + clusterGap;
      cursorX = 0;
      rowMaxHeight = 0;
    }

    for (const node of comp.nodes) {
      allNodes.push({
        ...node,
        position: {
          x: node.position.x - comp.minX + cursorX,
          y: node.position.y - comp.minY + cursorY,
        },
      });
    }

    cursorX += comp.width + clusterGap;
    rowMaxHeight = Math.max(rowMaxHeight, comp.height);
  }

  return { nodes: allNodes, edges };
};

const Canvas = ({
  redrawGraph,
  setRedrawGraph,
  finalLockCanvas,
  setTempLockCanvas,
  isPreviewMode = false,
  isRunning = false,
}: CanvasProps) => {
  const { data: session } = useSession();
  const [nodes, setNodes, onNodesChange] = useNodesState([]); //works when we click the node or move it.
  const [edges, setEdges, onEdgesChange] = useEdgesState([]); //workds when we click the edges.
  const [openOperationConfig, setOpenOperationConfig] = useState<boolean>(false); // this is the right form with sql operations.
  const [canvasLockStatus, setCanvasLockStatus] = useState<{
    isLocked: boolean;
    lockedBy?: string;
    loading?: boolean;
  }>({
    isLocked: isPreviewMode ? true : true, // Start locked until we confirm we can acquire lock
    lockedBy: undefined,
    loading: isPreviewMode ? false : true, // No loading in preview mode
  });
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [patModalOpen, setPatModalOpen] = useState(false);
  const [patRequired, setPatRequired] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [nodeDetailModal, setNodeDetailModal] = useState<{
    open: boolean;
    schema: string;
    table: string;
    nodeName: string;
    initialTab?: 'preview' | 'logs' | 'statistics';
  }>({ open: false, schema: '', table: '', nodeName: '' });
  const { addNodes, setCenter, getZoom, getNodes, setNodes: setReactFlowNodes } = useReactFlow();
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(new Set());
  // Generate canvas messages
  const getCanvasMessages = (): CanvasMessage[] => {
    const messages: CanvasMessage[] = [];

    // Lock status message
    if (
      canvasLockStatus.isLocked &&
      canvasLockStatus.lockedBy &&
      canvasLockStatus.lockedBy !== session?.user?.email
    ) {
      messages.push({
        id: 'lock-status',
        content: (
          <>
            <LockIcon sx={{ color: '#00897B', fontSize: '16px', mr: '6px' }} />
            <span>Locked. In use by {canvasLockStatus.lockedBy}</span>
          </>
        ),
        show: true,
      });
    }

    // Unpublished changes message
    const hasUnpublishedNodes = nodes.some((node) => node.data.isPublished === false);

    if (hasUnpublishedNodes) {
      messages.push({
        id: 'unpublished-changes',
        content: <span>Unpublished Changes</span>,
        show: true,
      });
    }

    // PAT required message
    if (patRequired && isViewOnlyMode) {
      messages.push({
        id: 'pat-required',
        content: (
          <span>
            Update key to make changes.{' '}
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onClick={() => setPatModalOpen(true)}
            >
              Add key here
            </span>
          </span>
        ),
        show: true,
      });
    }

    return messages;
  };

  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { canvasNode, setCanvasNode } = useCanvasNode();
  const { previewAction, setPreviewAction } = usePreviewAction();
  const previewNodeRef = useRef<PreviewTableData | null>();
  const globalContext = useContext(GlobalContext);
  const hasInitializedRef = useRef(false);
  const EdgeStyle: EdgeStyleProps = {
    markerEnd: {
      type: MarkerType.Arrow,
      width: 20,
      height: 20,
      color: 'black',
    },
  };

  // Sync canvas with remote repository
  const syncRemoteToCanvas = async () => {
    setTempLockCanvas(true);
    try {
      await httpPost(session, 'transform/v2/dbt_project/sync_remote_dbtproject_to_canvas/', {});
    } catch (error) {
      console.error('Failed to sync with remote:', error);
      throw error; // Let caller decide how to handle
    } finally {
      setTempLockCanvas(false);
    }
  };

  // Fetch graph data from backend (pure function - only fetches)
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

  // Initialize canvas on first load: sync then fetch
  const initializeCanvas = async () => {
    try {
      // Step 1: Sync with remote (only if not in preview mode)
      if (!isPreviewMode) {
        await syncRemoteToCanvas();
      }

      // Step 2: Fetch updated graph (handles its own lock state)
      await fetchDbtProjectGraph();
    } catch (error) {
      console.error('Canvas initialization failed:', error);
      // Even if sync fails, try to fetch local graph
      try {
        await fetchDbtProjectGraph();
      } catch (fetchError) {
        console.error('Failed to fetch graph after sync failure:', fetchError);
      }
    }
  };

  // PAT handler functions
  const handlePatAddKey = () => {
    setPatRequired(false);
    setIsViewOnlyMode(false);
    setPatModalOpen(false);
  };

  const handlePatViewOnly = () => {
    setIsViewOnlyMode(true);
    setPatModalOpen(false);
  };

  // Initial load effect - only runs once when session becomes available
  useEffect(() => {
    if (session && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeCanvas();
    }
  }, [session]);

  // Redraw effect - only runs when redrawGraph changes (and session exists)
  useEffect(() => {
    if (session && hasInitializedRef.current) {
      fetchDbtProjectGraph();
    }
  }, [redrawGraph]);

  // Canvas Lock Management State
  const lockRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Acquire canvas lock
  const acquireCanvasLock = async () => {
    try {
      console.log('Attempting to acquire canvas lock...');
      const response = await httpPost(session, 'transform/dbt_project/canvas/lock/', {});
      console.log('Lock acquired successfully:', response);
      setCanvasLockStatus({
        isLocked: true,
        lockedBy: response.locked_by,
        loading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Lock acquisition failed:', {
        message: error.message,
        cause: error.cause,
        detail: error.cause?.detail,
        stack: error.stack,
      });
      if (error.cause?.detail) {
        const match = error.cause.detail.match(/locked by (.+)$/);
        if (match) {
          setCanvasLockStatus({
            isLocked: true,
            lockedBy: match[1],
            loading: false,
          });
        }
      } else {
        // Set canvas as unlocked if we can't acquire lock and no specific lock owner
        setCanvasLockStatus({
          isLocked: false,
          lockedBy: undefined,
          loading: false,
        });
      }
      return false;
    }
  };

  // Refresh canvas lock
  const refreshCanvasLock = async () => {
    try {
      await httpPut(session, 'transform/dbt_project/canvas/lock/refresh/', {});
      console.log('Lock refreshed successfully at', new Date().toLocaleTimeString());
      return true;
    } catch (error: any) {
      console.error('Lock refresh failed:', {
        message: error.message,
        detail: error.cause?.detail,
      });
      return false;
    }
  };

  // Release canvas lock
  const releaseCanvasLock = async () => {
    try {
      await httpDelete(session, 'transform/dbt_project/canvas/lock/');
      console.log('Lock released');
      setCanvasLockStatus({
        isLocked: false,
        lockedBy: undefined,
        loading: false,
      });
    } catch (error) {
      console.log('Lock release failed:', error);
    }
  };

  // Helper function to determine if current user can interact with canvas
  const canInteractWithCanvas = (): boolean => {
    // If in preview mode, never allow interaction
    if (isPreviewMode) {
      return false;
    }

    // If still loading, don't allow interaction (secure by default)
    if (canvasLockStatus.loading) {
      return false;
    }

    // If PAT is required but user is in view-only mode, don't allow interaction
    if (patRequired && isViewOnlyMode) {
      return false;
    }

    // If canvas is not locked by anyone, we can interact
    if (!canvasLockStatus.isLocked) {
      return true;
    }

    // Check if the lock is owned by the current user
    const currentUserEmail = session?.user?.email;
    if (currentUserEmail && canvasLockStatus.lockedBy === currentUserEmail) {
      return true;
    }

    // Canvas is locked by someone else, we cannot interact
    return false;
  };

  // Lock management effect - acquire lock on mount and setup 30-second refresh timer
  useEffect(() => {
    if (!session || isPreviewMode) return; // Skip lock acquisition in preview mode

    let mounted = true;

    const initializeLock = async () => {
      const acquired = await acquireCanvasLock();
      console.log('Canvas lock acquired:', acquired);

      if (!acquired || !mounted) {
        console.log('Lock not acquired or component unmounted');
        return;
      }

      // Set up refresh timer - refresh every 30 seconds
      console.log('Setting up 30-second refresh timer...');
      const timer = setInterval(() => {
        if (!mounted) {
          console.log('Component unmounted, skipping refresh');
          return;
        }

        console.log('30 seconds elapsed - attempting to refresh lock...');
        refreshCanvasLock().then((success) => {
          if (!success && mounted) {
            console.log('Refresh failed, attempting to re-acquire lock...');
            acquireCanvasLock();
          }
        });
      }, 30000); // 30 seconds

      lockRefreshTimerRef.current = timer;
      console.log('Lock refresh timer started - will refresh every 30 seconds');
    };

    initializeLock();

    return () => {
      mounted = false;

      // Clear the refresh timer
      if (lockRefreshTimerRef.current) {
        console.log('Clearing refresh timer');
        clearInterval(lockRefreshTimerRef.current);
        lockRefreshTimerRef.current = null;
      }

      // Only release lock if we actually own it
      const currentUserEmail = session?.user?.email;
      if (canvasLockStatus.isLocked && canvasLockStatus.lockedBy === currentUserEmail) {
        console.log('Releasing lock on unmount');
        releaseCanvasLock();
      }
    };
  }, [session]);

  // Cleanup handlers for comprehensive lock management
  useEffect(() => {
    // Function to handle cleanup synchronously for critical scenarios
    const handleSyncCleanup = () => {
      // Fire and forget emergency cleanup if we own the lock
      const currentUserEmail = session?.user?.email;
      if (
        currentUserEmail &&
        canvasLockStatus.isLocked &&
        canvasLockStatus.lockedBy === currentUserEmail
      ) {
        releaseCanvasLock().catch(() => {
          console.error('Emergency lock cleanup failed');
        });
      }
    };

    // Handle browser navigation (back/forward buttons, direct navigation)
    const handleBeforeUnload = () => {
      handleSyncCleanup();
    };

    // Handle popstate for browser back/forward
    const handlePopState = () => {
      handleSyncCleanup();
    };

    // Intercept link clicks to navigate away from canvas
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && link.href) {
        const url = new URL(link.href, window.location.origin);
        // Check if navigating away from current canvas
        if (url.pathname !== window.location.pathname) {
          handleSyncCleanup();
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick, true); // Use capture phase

    // Cleanup function that runs when component unmounts
    return () => {
      handleSyncCleanup();

      // Clean up event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [canvasLockStatus, session?.user?.email]);

  // Check PAT status on canvas load
  useEffect(() => {
    const checkPatStatus = async () => {
      if (!session || isPreviewMode) return; // Skip PAT check in preview mode

      try {
        const response = await httpGet(session, 'dbt/dbt_workspace');

        if (response && !response.error) {
          const needsPAT =
            response.transform_type === 'github' && response.gitrepo_access_token === null;

          setPatRequired(needsPAT);
          setGitRepoUrl(response.gitrepo_url || '');

          // Show PAT modal immediately if PAT is required (and not in preview mode)
          if (needsPAT) {
            setPatModalOpen(true);
          }
        }
      } catch (error) {
        console.error('Error checking PAT status:', error);
      }
    };

    checkPatStatus();
  }, [session, isPreviewMode]);

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

        // Check if node already exists on canvas by checking if any node's data matches the dbtmodel uuid
        const existingNode = nodes.find((node) => {
          // Check if the node has a dbtmodel and it matches the source model uuid
          return node.data?.dbtmodel?.uuid === dbtSourceModel.uuid;
        });

        if (existingNode) {
          // Node already exists, focus and select it instead of creating a duplicate
          setCenter(existingNode.position.x, existingNode.position.y, {
            zoom: getZoom(), // Zoom in 1.5x, but cap at 2x max zoom
            duration: 500,
          });

          // Select the existing node by updating its selected state
          setNodes((nds) =>
            nds.map((node) => ({
              ...node,
              selected: node.id === existingNode.id,
            }))
          );

          return; // Exit early, don't create a new node
        }

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

    if (canvasAction.type === 'open-node-detail-modal') {
      setNodeDetailModal({
        open: true,
        schema: canvasAction.data.schema,
        table: canvasAction.data.table,
        nodeName: canvasAction.data.nodeName,
        initialTab: canvasAction.data.initialTab,
      });
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

  // Graph traversal: BFS downstream (source→target direction)
  const getDownstreamPath = (startNodeId: string, allEdges: Edge[]) => {
    const visitedNodes = new Set<string>([startNodeId]);
    const visitedEdges = new Set<string>();
    const queue = [startNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of allEdges) {
        if (edge.source === current && !visitedNodes.has(edge.target)) {
          visitedNodes.add(edge.target);
          visitedEdges.add(edge.id);
          queue.push(edge.target);
        }
      }
    }
    return { nodeIds: visitedNodes, edgeIds: visitedEdges };
  };

  // Graph traversal: BFS upstream (target→source direction)
  const getUpstreamPath = (startNodeId: string, allEdges: Edge[]) => {
    const visitedNodes = new Set<string>([startNodeId]);
    const visitedEdges = new Set<string>();
    const queue = [startNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of allEdges) {
        if (edge.target === current && !visitedNodes.has(edge.source)) {
          visitedNodes.add(edge.source);
          visitedEdges.add(edge.id);
          queue.push(edge.source);
        }
      }
    }
    return { nodeIds: visitedNodes, edgeIds: visitedEdges };
  };

  const handleNodeClick = (_event: React.MouseEvent, node: { id: string }) => {
    const outgoingEdges = edges.filter((e) => e.source === node.id);
    let result;
    if (outgoingEdges.length > 0) {
      // Has downstream connections → highlight downstream path
      result = getDownstreamPath(node.id, edges);
    } else {
      // End node → highlight upstream path back to source
      result = getUpstreamPath(node.id, edges);
    }
    setHighlightedNodeIds(result.nodeIds);
    setHighlightedEdgeIds(result.edgeIds);
  };

  const handlePaneClick = () => {
    // clicking the background canvas.
    setCanvasAction({ type: 'close-reset-opconfig-panel', data: null });
    setPreviewAction({ type: 'clear-preview', data: null });
    setHighlightedNodeIds(new Set());
    setHighlightedEdgeIds(new Set());
  };

  // Apply highlight/dim styles to nodes and edges
  const hasHighlight = highlightedNodeIds.size > 0;

  const styledNodes = useMemo(() => {
    if (!hasHighlight) return nodes;
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: highlightedNodeIds.has(node.id),
        isDimmed: !highlightedNodeIds.has(node.id),
      },
    }));
  }, [nodes, highlightedNodeIds, hasHighlight]);

  const styledEdges = useMemo(() => {
    if (!hasHighlight) return edges;
    return edges.map((edge) => {
      const isHighlighted = highlightedEdgeIds.has(edge.id);
      return {
        ...edge,
        type: edge.type,
        style: isHighlighted
          ? { stroke: '#00897B', strokeWidth: 2, transition: 'stroke 0.3s, opacity 0.3s' }
          : {
              stroke: '#D0D0D0',
              strokeWidth: 1,
              opacity: 0.15,
              transition: 'stroke 0.3s, opacity 0.3s',
            },
        animated: isHighlighted,
        markerEnd: isHighlighted
          ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#00897B' }
          : { type: MarkerType.Arrow, width: 12, height: 12, color: '#D0D0D0' },
      };
    });
  }, [edges, highlightedEdgeIds, hasHighlight]);

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
      {!isPreviewMode && (
        <>
          <Box
            sx={{
              height: '44px',
              background: '#F5FAFA',
              borderTop: '1px #CCD6E2 solid',
            }}
          >
            <CanvasHeader
              finalLockCanvas={finalLockCanvas}
              canInteractWithCanvas={canInteractWithCanvas}
              onPublishClick={() => setPublishModalOpen(true)}
            />
          </Box>
          <Divider orientation="horizontal" sx={{ color: 'black' }} />
        </>
      )}
      <Box
        sx={{
          display: 'flex',
          height: 'calc(100% - 44px)',
          background: 'white',
          position: 'relative',
        }}
      >
        <ReactFlow
          nodes={styledNodes}
          selectNodesOnDrag={false}
          edges={styledEdges}
          onNodeDragStop={canInteractWithCanvas() ? onNodeDragStop : undefined}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick} //back canvas click.
          onNodesChange={canInteractWithCanvas() ? handleNodesChange : undefined} // when node (table or operation) is clicked or moved.
          onEdgesChange={canInteractWithCanvas() ? handleEdgesChange : undefined}
          onConnect={canInteractWithCanvas() ? handleNewConnection : undefined}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          proOptions={{ hideAttribution: true }}
          defaultViewport={defaultViewport}
          fitView
          nodesDraggable={canInteractWithCanvas() ? true : false}
          nodesConnectable={canInteractWithCanvas() ? true : false}
          elementsSelectable={canInteractWithCanvas() ? true : false}
          panOnDrag={true} // Always allow panning (for zoom/navigation)
          zoomOnScroll={true} // Always allow zoom
          zoomOnPinch={true} // Always allow zoom
          zoomOnDoubleClick={canInteractWithCanvas() ? true : false} // Only allow double-click zoom if can interact
        >
          {/* Hide default zoom (+/-), fit view and interactive (lock) controls
             and keep only the custom control button(s) we want. */}
          <Controls showInteractive={false} showZoom={true} showFitView={true}>
            {!isPreviewMode && (
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
            )}
          </Controls>
          <Background />
        </ReactFlow>

        {/* Canvas Messages */}
        <CanvasMessages messages={getCanvasMessages()} />

        {/* Floating running indicator */}
        {isRunning && (
          <Box
            onClick={() => {
              setNodeDetailModal({
                open: true,
                schema: '',
                table: '',
                nodeName: 'Workflow',
                initialTab: 'logs',
              });
            }}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: '8px 20px',
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              zIndex: (theme: any) => theme.zIndex.drawer + 2,
              '&:hover': { backgroundColor: '#F5F5F5' },
            }}
          >
            <CircularProgress size={16} sx={{ color: '#00897B' }} />
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
              Running workflow...
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#00897B',
                textDecoration: 'underline',
              }}
            >
              View logs
            </Typography>
          </Box>
        )}

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

        {/* Publish Modal */}
        <PublishModal
          open={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          onPublishSuccess={() => {
            // Refresh the canvas to show updated publish status
            setRedrawGraph(!redrawGraph);
            successToast('Changes published successfully', [], globalContext);
          }}
        />

        {/* PAT Required Modal */}
        <PatRequiredModal
          open={patModalOpen}
          onClose={() => setPatModalOpen(false)}
          onAddKey={handlePatAddKey}
          onViewOnly={handlePatViewOnly}
          gitRepoUrl={gitRepoUrl}
        />

        {/* Node Detail Modal */}
        <NodeDetailModal
          open={nodeDetailModal.open}
          onClose={() => setNodeDetailModal({ open: false, schema: '', table: '', nodeName: '' })}
          schema={nodeDetailModal.schema}
          table={nodeDetailModal.table}
          nodeName={nodeDetailModal.nodeName}
          finalLockCanvas={finalLockCanvas}
          initialTab={nodeDetailModal.initialTab}
        />
      </Box>
    </Box>
  );
};

export default Canvas;

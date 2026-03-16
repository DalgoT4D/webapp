import { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { useConnSyncLogs, useConnSyncLogsUpdate } from '@/contexts/ConnectionSyncLogsContext';
import { useTracking } from '@/contexts/TrackingContext';
import { lastRunTime, trimEmail, delay } from '@/utils/common';
import { Connection } from '@/components/Connections/Connections';

// --- Types ---

export interface WarehouseInfo {
  name: string;
  wtype: string;
  destinationId: string;
  destinationDefinitionId: string;
  airbyteWorkspaceId: string;
  icon: string;
  connectionConfiguration: any;
  airbyteDockerRepository: string;
  tag: string;
}

export type SourceDefOption = {
  id: string;
  label: string;
  dockerRepository: string;
  dockerImageTag: string;
  tag: string;
};

export interface SourceApiItem {
  sourceId: string;
  name: string;
  sourceName: string;
  sourceDefinitionId: string;
  icon: string;
  connectionConfiguration: object;
  workspaceId: string;
}

export interface SourceGroup {
  source: SourceApiItem;
  sourceDefLabel: string;
  dockerTag: string;
  connections: Connection[];
}

type PrefectFlowRun = {
  id: string;
  name: string;
  deployment_id: string;
  flow_id: string;
  state_type: string;
  state_name: string;
};

type PrefectFlowRunLog = {
  level: number;
  timestamp: string;
  message: string;
};

function getMostRecentSync(connections: Connection[]): number | null {
  let latest: number | null = null;
  for (const conn of connections) {
    if (conn.lastRun?.startTime) {
      const ts = new Date(conn.lastRun.startTime).getTime();
      if (latest === null || ts > latest) latest = ts;
    }
  }
  return latest;
}

export function useIngestData() {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const isDemo = globalContext?.CurrentOrg.state.is_demo;
  const trackAmplitudeEvent = useTracking();
  const syncLogs = useConnSyncLogs();
  const setSyncLogs = useConnSyncLogsUpdate();

  // --- Warehouse ---
  const {
    data: warehouseData,
    isLoading: warehouseLoading,
    mutate: mutateWarehouse,
  } = useSWR('organizations/warehouses', { revalidateOnFocus: false });

  const [warehouse, setWarehouse] = useState<WarehouseInfo | null>(null);
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  const [showWarehouseDetails, setShowWarehouseDetails] = useState(false);

  useEffect(() => {
    if (warehouseData?.warehouses?.length > 0) {
      const w = warehouseData.warehouses[0];
      setWarehouse({
        airbyteWorkspaceId: w.airbyte_destination.workspaceId,
        airbyteDockerRepository: w.airbyte_docker_repository,
        tag: w.airbyte_docker_image_tag,
        destinationId: w.airbyte_destination.destinationId,
        destinationDefinitionId: w.airbyte_destination.destinationDefinitionId,
        name: w.name,
        wtype: w.wtype,
        icon: w.airbyte_destination.icon,
        connectionConfiguration: w.airbyte_destination.connectionConfiguration,
      });
    } else {
      setWarehouse(null);
    }
  }, [warehouseData]);

  // --- Warehouse delete ---
  const [showDeleteWarehouseDialog, setShowDeleteWarehouseDialog] = useState(false);
  const [deleteWarehouseLoading, setDeleteWarehouseLoading] = useState(false);

  const deleteWarehouse = async () => {
    try {
      setDeleteWarehouseLoading(true);
      await httpDelete(session, 'v1/organizations/warehouses/');
      setWarehouse(null);
      mutateWarehouse();
      setShowDeleteWarehouseDialog(false);
      setShowWarehouseDetails(false);
      successToast('Warehouse deleted', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setDeleteWarehouseLoading(false);
    }
  };

  // --- Sources ---
  const { data: sourcesData, mutate: mutateSources } = useSWR('airbyte/sources');

  // --- Connections (with polling when any lock exists) ---
  const { data: connectionsData, mutate: mutateConnections } = useSWR(
    'airbyte/v1/connections',
    null,
    {
      refreshInterval: (data: any) => {
        return Array.isArray(data) && data.some((conn: any) => conn.lock) ? 3000 : 0;
      },
    }
  );

  // --- Source definitions ---
  const [sourceDefs, setSourceDefs] = useState<SourceDefOption[]>([]);
  const [sourceDefsLoading, setSourceDefsLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    const fetchSourceDefs = async () => {
      setSourceDefsLoading(true);
      try {
        const data = await httpGet(session, 'airbyte/source_definitions');
        const defs: SourceDefOption[] = data?.map((el: any) => ({
          id: el.sourceDefinitionId,
          label: el.name,
          dockerRepository: el.dockerRepository,
          dockerImageTag: el.dockerImageTag,
          tag: el.dockerImageTag,
        }));
        setSourceDefs(defs || []);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
      setSourceDefsLoading(false);
    };
    fetchSourceDefs();
  }, [session]);

  // --- Search ---
  const [searchText, setSearchText] = useState('');

  // --- Source form ---
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [sourceIdToEdit, setSourceIdToEdit] = useState('');
  const [sourceFormLoading, setSourceFormLoading] = useState(false);

  // --- Connection form ---
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionIdToEdit, setConnectionIdToEdit] = useState('');
  const [connectionViewMode, setConnectionViewMode] = useState(false);

  // --- Sync state ---
  const [syncingConnectionIds, setSyncingConnectionIds] = useState<string[]>([]);
  const [expandSyncLogs, setExpandSyncLogs] = useState(false);

  // --- View history dialog ---
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [logsConnection, setLogsConnection] = useState<Connection>();

  // --- Source actions menu ---
  const [sourceMenuAnchorEl, setSourceMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [sourceMenuSourceId, setSourceMenuSourceId] = useState('');
  const [showDeleteSourceDialog, setShowDeleteSourceDialog] = useState(false);
  const [deleteSourceLoading, setDeleteSourceLoading] = useState(false);

  // --- Connection actions menu ---
  const [connMenuAnchorEl, setConnMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [connMenuConnectionId, setConnMenuConnectionId] = useState('');
  const [connMenuClearDeploymentId, setConnMenuClearDeploymentId] = useState<string | null>('');
  const [connMenuSyncState, setConnMenuSyncState] = useState(false);
  const [showDeleteConnDialog, setShowDeleteConnDialog] = useState(false);
  const [deleteConnLoading, setDeleteConnLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Clear streams ---
  const [showStreamSelectionDialog, setShowStreamSelectionDialog] = useState(false);
  const [showConfirmClearStreamsDialog, setShowConfirmClearStreamsDialog] = useState(false);
  const [selectedStreamsForClear, setSelectedStreamsForClear] = useState<
    Array<{ streamName: string; streamNamespace?: string }>
  >([]);
  const [clearAllStreams, setClearAllStreams] = useState(false);
  const [clearStreamsLoading, setClearStreamsLoading] = useState(false);

  // --- New-item tracking for onboarding animations ---
  const prevSourceIdsRef = useRef<Set<string>>(new Set());
  const prevConnectionIdsRef = useRef<Set<string>>(new Set());
  const [newSourceIds, setNewSourceIds] = useState<Set<string>>(new Set());
  const [newConnectionIds, setNewConnectionIds] = useState<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!sourcesData || !connectionsData) return;

    const currentSourceIds = new Set<string>(
      (sourcesData as SourceApiItem[]).map((s) => s.sourceId)
    );
    const currentConnectionIds = new Set<string>(
      (connectionsData as Connection[]).map((c) => c.connectionId)
    );

    if (initialLoadRef.current) {
      prevSourceIdsRef.current = currentSourceIds;
      prevConnectionIdsRef.current = currentConnectionIds;
      initialLoadRef.current = false;
      return;
    }

    const addedSources = new Set<string>();
    Array.from(currentSourceIds).forEach((id) => {
      if (!prevSourceIdsRef.current.has(id)) addedSources.add(id);
    });

    const addedConnections = new Set<string>();
    Array.from(currentConnectionIds).forEach((id) => {
      if (!prevConnectionIdsRef.current.has(id)) addedConnections.add(id);
    });

    if (addedSources.size > 0) setNewSourceIds(addedSources);
    if (addedConnections.size > 0) setNewConnectionIds(addedConnections);

    prevSourceIdsRef.current = currentSourceIds;
    prevConnectionIdsRef.current = currentConnectionIds;

    if (addedSources.size > 0 || addedConnections.size > 0) {
      const timer = setTimeout(() => {
        setNewSourceIds(new Set());
        setNewConnectionIds(new Set());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sourcesData, connectionsData]);

  const isSourceNew = useCallback((sourceId: string) => newSourceIds.has(sourceId), [newSourceIds]);
  const isConnectionNew = useCallback(
    (connectionId: string) => newConnectionIds.has(connectionId),
    [newConnectionIds]
  );

  // --- Schema changes ---
  const [schemaChanges, setSchemaChanges] = useState<Record<string, string>>({});
  const [showSchemaChangeDialog, setShowSchemaChangeDialog] = useState(false);
  const [schemaChangeConnectionId, setSchemaChangeConnectionId] = useState('');

  const fetchSchemaChanges = async () => {
    try {
      const data = await httpGet(session, 'airbyte/v1/connection/schema_change');
      const map: Record<string, string> = {};
      if (Array.isArray(data)) {
        for (const item of data) {
          map[item.connection_id] = item.change_type;
        }
      }
      setSchemaChanges(map);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchSchemaChanges();
    }
  }, [session]);

  // --- Build source def map ---
  const sourceDefMap = useMemo(() => {
    const map: Record<string, { label: string; dockerRepository: string; tag: string }> = {};
    for (const def of sourceDefs) {
      map[def.id] = { label: def.label, dockerRepository: def.dockerRepository, tag: def.tag };
    }
    return map;
  }, [sourceDefs]);

  // --- Sync logic ---
  const fetchFlowRunStatus = async (flowRunId: string): Promise<string> => {
    try {
      const flowRun: PrefectFlowRun = await httpGet(session, `prefect/flow_runs/${flowRunId}`);
      return flowRun.state_type || 'FAILED';
    } catch (err: any) {
      console.error(err);
      return 'FAILED';
    }
  };

  const fetchAndSetFlowRunLogs = async (flowRunId: string) => {
    try {
      const response = await httpGet(session, `prefect/flow_runs/${flowRunId}/logs`);
      if (response?.logs?.logs?.length > 0) {
        const logsArray = response.logs.logs.map(
          (logObject: PrefectFlowRunLog) => `${logObject.message} '\n'`
        );
        setSyncLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const pollForFlowRun = async (flowRunId: string) => {
    let status = await fetchFlowRunStatus(flowRunId);
    await fetchAndSetFlowRunLogs(flowRunId);
    while (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
      await delay(5000);
      await fetchAndSetFlowRunLogs(flowRunId);
      status = await fetchFlowRunStatus(flowRunId);
    }
  };

  const syncConnection = async (deploymentId: string, connectionId: string) => {
    setExpandSyncLogs(true);
    if (!deploymentId) {
      errorToast('Deployment not created', [], globalContext);
      return;
    }
    try {
      const response = await httpPost(session, `prefect/v1/flows/${deploymentId}/flow_run/`, {});
      if (response?.detail) {
        errorToast(response.detail, [], globalContext);
        return { error: 'ERROR' };
      }
      if (!response?.flow_run_id) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }
      successToast('Sync initiated successfully', [], globalContext);
      pollForFlowRun(response.flow_run_id);
      mutateConnections();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
      return { error: 'ERROR' };
    } finally {
      setSyncingConnectionIds((prev) => prev.filter((id) => id !== connectionId));
    }
  };

  // --- Source CRUD ---
  const handleSourceMenuOpen = (sourceId: string, event: HTMLElement) => {
    setSourceMenuSourceId(sourceId);
    setSourceMenuAnchorEl(event);
  };

  const handleSourceMenuClose = () => {
    setSourceMenuAnchorEl(null);
  };

  const handleEditSource = () => {
    setSourceIdToEdit(sourceMenuSourceId);
    handleSourceMenuClose();
    setShowSourceDialog(true);
  };

  const handleDeleteSourceClick = () => {
    handleSourceMenuClose();
    setShowDeleteSourceDialog(true);
  };

  const deleteSource = async () => {
    try {
      setDeleteSourceLoading(true);
      const response = await httpDelete(session, `airbyte/sources/${sourceMenuSourceId}`);
      if (response.success) {
        successToast('Source deleted', [], globalContext);
        mutateSources();
        mutateConnections();
      } else {
        errorToast('Something went wrong. Please try again', [], globalContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setDeleteSourceLoading(false);
      setShowDeleteSourceDialog(false);
      setSourceMenuSourceId('');
    }
  };

  // --- Connection CRUD ---
  const handleConnMenuOpen = (connection: Connection, event: HTMLElement) => {
    setConnMenuConnectionId(connection.connectionId);
    setConnMenuClearDeploymentId(connection.clearConnDeploymentId);
    const isSyncing = !!connection.lock || syncingConnectionIds.includes(connection.connectionId);
    setConnMenuSyncState(isSyncing);
    setConnMenuAnchorEl(event);
  };

  const handleConnMenuClose = (isEditMode?: string) => {
    if (isEditMode !== 'EDIT') {
      setConnMenuConnectionId('');
      setConnMenuClearDeploymentId('');
    }
    setConnMenuAnchorEl(null);
  };

  const handleEditConnection = () => {
    handleConnMenuClose('EDIT');
    setConnectionIdToEdit(connMenuConnectionId);
    setConnectionViewMode(false);
    setShowConnectionDialog(true);
  };

  const handleViewConnection = () => {
    handleConnMenuClose('EDIT');
    setConnectionIdToEdit(connMenuConnectionId);
    setConnectionViewMode(true);
    setShowConnectionDialog(true);
  };

  const handleDeleteConnectionClick = () => {
    handleConnMenuClose('EDIT');
    setShowDeleteConnDialog(true);
  };

  const deleteConnection = async () => {
    try {
      setDeleteConnLoading(true);
      const message = await httpDelete(session, `airbyte/v1/connections/${connMenuConnectionId}`);
      if (message.success) {
        successToast('Connection deleted', [], globalContext);
        mutateConnections();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setDeleteConnLoading(false);
      setShowDeleteConnDialog(false);
      setConnMenuConnectionId('');
    }
  };

  const refreshConnectionSchema = async () => {
    handleConnMenuClose();
    setIsRefreshing(true);
    try {
      const response = await httpGet(
        session,
        `airbyte/v1/connections/${connMenuConnectionId}/catalog`
      );
      const checkRefresh = async () => {
        const refreshResponse = await httpGet(session, 'tasks/stp/' + response.task_id);
        if (refreshResponse.progress?.length > 0) {
          const lastStatus = refreshResponse.progress[refreshResponse.progress.length - 1].status;
          if (lastStatus === 'failed') {
            errorToast('Failed to refresh connection', [], globalContext);
            return;
          } else if (lastStatus === 'completed') {
            successToast('Connection refreshed successfully', [], globalContext);
            mutateConnections();
            return;
          }
        }
        await delay(2000);
        await checkRefresh();
      };
      await checkRefresh();
    } catch (err: any) {
      console.error(err);
      errorToast('Failed to refresh connection', [], globalContext);
    } finally {
      setIsRefreshing(false);
    }
  };

  // --- Clear streams ---
  const handleClearStreams = () => {
    handleConnMenuClose('EDIT');
    setShowStreamSelectionDialog(true);
    trackAmplitudeEvent('[Reset-connection] Button Clicked');
  };

  const handleStreamSelectionConfirm = (
    selectedStreams: Array<{ streamName: string; streamNamespace?: string }>,
    selectAll: boolean
  ) => {
    setSelectedStreamsForClear(selectedStreams);
    setClearAllStreams(selectAll);
    setShowStreamSelectionDialog(false);
    setShowConfirmClearStreamsDialog(true);
  };

  const handleConfirmClearStreams = async () => {
    if (!connMenuClearDeploymentId) {
      errorToast('Deployment not created', [], globalContext);
      return;
    }
    try {
      setClearStreamsLoading(true);
      if (clearAllStreams) {
        await httpPost(session, `prefect/v1/flows/${connMenuClearDeploymentId}/flow_run/`, {});
        successToast('Clear connection initiated successfully', [], globalContext);
      } else {
        await httpPost(session, `prefect/v1/flows/${connMenuClearDeploymentId}/clear_streams/`, {
          connectionId: connMenuConnectionId,
          streams: selectedStreamsForClear,
        });
        successToast('Selected streams initiated for clear successfully', [], globalContext);
      }
      mutateConnections();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setClearStreamsLoading(false);
      setShowConfirmClearStreamsDialog(false);
      setSelectedStreamsForClear([]);
    }
  };

  // --- Direct action handlers (bypass menu anchor pattern) ---
  const handleEditSourceDirect = (sourceId: string) => {
    setSourceIdToEdit(sourceId);
    setShowSourceDialog(true);
  };

  const handleDeleteSourceDirect = (sourceId: string) => {
    setSourceMenuSourceId(sourceId);
    setShowDeleteSourceDialog(true);
  };

  const handleEditConnectionDirect = (connectionId: string) => {
    setConnectionIdToEdit(connectionId);
    setConnectionViewMode(false);
    setShowConnectionDialog(true);
  };

  const handleViewConnectionDirect = (connectionId: string) => {
    setConnectionIdToEdit(connectionId);
    setConnectionViewMode(true);
    setShowConnectionDialog(true);
  };

  const handleDeleteConnectionDirect = (connectionId: string) => {
    setConnMenuConnectionId(connectionId);
    setShowDeleteConnDialog(true);
  };

  const handleRefreshConnectionDirect = async (connectionId: string) => {
    setIsRefreshing(true);
    try {
      const response = await httpGet(session, `airbyte/v1/connections/${connectionId}/catalog`);
      const checkRefresh = async () => {
        const refreshResponse = await httpGet(session, 'tasks/stp/' + response.task_id);
        if (refreshResponse.progress?.length > 0) {
          const lastStatus = refreshResponse.progress[refreshResponse.progress.length - 1].status;
          if (lastStatus === 'failed') {
            errorToast('Failed to refresh connection', [], globalContext);
            return;
          } else if (lastStatus === 'completed') {
            successToast('Connection refreshed successfully', [], globalContext);
            mutateConnections();
            return;
          }
        }
        await delay(2000);
        await checkRefresh();
      };
      await checkRefresh();
    } catch (err: any) {
      console.error(err);
      errorToast('Failed to refresh connection', [], globalContext);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearStreamsDirect = (connectionId: string, clearDeploymentId: string | null) => {
    setConnMenuConnectionId(connectionId);
    setConnMenuClearDeploymentId(clearDeploymentId);
    setShowStreamSelectionDialog(true);
    trackAmplitudeEvent('[Reset-connection] Button Clicked');
  };

  // --- Open "Add Connection" for a specific source ---
  const [sourceIdForNewConnection, setSourceIdForNewConnection] = useState('');

  const handleAddConnection = (sourceId: string) => {
    setSourceIdForNewConnection(sourceId);
    setConnectionIdToEdit('');
    setConnectionViewMode(false);
    setShowConnectionDialog(true);
  };

  // --- Group sources with their connections ---
  const sourceGroups: SourceGroup[] = useMemo(() => {
    const sources: SourceApiItem[] = sourcesData || [];
    const connections: Connection[] = connectionsData || [];

    const connBySource: Record<string, Connection[]> = {};
    for (const conn of connections) {
      const sid = conn.source?.sourceId;
      if (sid) {
        if (!connBySource[sid]) connBySource[sid] = [];
        connBySource[sid].push(conn);
      }
    }

    const groups: SourceGroup[] = sources.map((source) => {
      const def = sourceDefMap[source.sourceDefinitionId];
      return {
        source,
        sourceDefLabel: def?.label || source.sourceName || '',
        dockerTag: def ? `${def.dockerRepository}:${def.tag}` : '',
        connections: connBySource[source.sourceId] || [],
      };
    });

    groups.sort((a, b) => {
      const aIsNew =
        newSourceIds.has(a.source.sourceId) ||
        a.connections.some((c) => newConnectionIds.has(c.connectionId));
      const bIsNew =
        newSourceIds.has(b.source.sourceId) ||
        b.connections.some((c) => newConnectionIds.has(c.connectionId));
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;

      if (a.connections.length === 0 && b.connections.length > 0) return 1;
      if (a.connections.length > 0 && b.connections.length === 0) return -1;
      const aLatest = getMostRecentSync(a.connections);
      const bLatest = getMostRecentSync(b.connections);
      if (aLatest && bLatest) return bLatest - aLatest;
      if (aLatest) return -1;
      if (bLatest) return 1;
      return a.source.name.localeCompare(b.source.name);
    });

    return groups;
  }, [sourcesData, connectionsData, sourceDefMap, newSourceIds, newConnectionIds]);

  // --- Filter by search ---
  const filteredGroups = useMemo(() => {
    const lower = searchText.toLowerCase().trim();
    if (!lower) return sourceGroups;
    return sourceGroups.filter(
      (group) =>
        group.source.name.toLowerCase().includes(lower) ||
        group.sourceDefLabel.toLowerCase().includes(lower) ||
        group.connections.some((conn) => conn.name?.toLowerCase().includes(lower))
    );
  }, [sourceGroups, searchText]);

  const isLoading = !sourcesData || !connectionsData || sourceDefsLoading || isRefreshing;

  return {
    // Context
    session,
    globalContext,
    permissions,
    isDemo,
    trackAmplitudeEvent,
    syncLogs,
    setSyncLogs,

    // Warehouse
    warehouse,
    warehouseLoading,
    mutateWarehouse,
    showWarehouseDialog,
    setShowWarehouseDialog,
    showWarehouseDetails,
    setShowWarehouseDetails,
    showDeleteWarehouseDialog,
    setShowDeleteWarehouseDialog,
    deleteWarehouse,
    deleteWarehouseLoading,

    // Sources
    sourcesData,
    mutateSources,
    sourceDefs,
    sourceDefsLoading,
    sourceDefMap,

    // Connections
    connectionsData,
    mutateConnections,

    // Source groups
    sourceGroups,
    filteredGroups,
    isLoading,

    // Search
    searchText,
    setSearchText,

    // Source form
    showSourceDialog,
    setShowSourceDialog,
    sourceIdToEdit,
    setSourceIdToEdit,
    sourceFormLoading,
    setSourceFormLoading,

    // Source actions menu
    sourceMenuAnchorEl,
    sourceMenuSourceId,
    handleSourceMenuOpen,
    handleSourceMenuClose,
    handleEditSource,
    handleDeleteSourceClick,
    deleteSource,
    showDeleteSourceDialog,
    setShowDeleteSourceDialog,
    deleteSourceLoading,

    // Connection form
    showConnectionDialog,
    setShowConnectionDialog,
    connectionIdToEdit,
    setConnectionIdToEdit,
    connectionViewMode,
    setConnectionViewMode,

    // Connection actions menu
    connMenuAnchorEl,
    connMenuConnectionId,
    connMenuClearDeploymentId,
    connMenuSyncState,
    handleConnMenuOpen,
    handleConnMenuClose,
    handleEditConnection,
    handleViewConnection,
    handleDeleteConnectionClick,
    deleteConnection,
    showDeleteConnDialog,
    setShowDeleteConnDialog,
    deleteConnLoading,

    // Sync
    syncingConnectionIds,
    setSyncingConnectionIds,
    syncConnection,
    expandSyncLogs,
    setExpandSyncLogs,

    // View history
    showLogsDialog,
    setShowLogsDialog,
    logsConnection,
    setLogsConnection,

    // Schema changes
    schemaChanges,
    showSchemaChangeDialog,
    setShowSchemaChangeDialog,
    schemaChangeConnectionId,
    setSchemaChangeConnectionId,
    fetchSchemaChanges,

    // Clear streams
    handleClearStreams,
    handleStreamSelectionConfirm,
    handleConfirmClearStreams,
    showStreamSelectionDialog,
    setShowStreamSelectionDialog,
    showConfirmClearStreamsDialog,
    setShowConfirmClearStreamsDialog,
    selectedStreamsForClear,
    clearStreamsLoading,

    // Refresh
    refreshConnectionSchema,
    isRefreshing,

    // New item tracking
    isSourceNew,
    isConnectionNew,
    newSourceIds,
    newConnectionIds,

    // Direct action handlers (no menu)
    handleEditSourceDirect,
    handleDeleteSourceDirect,
    handleEditConnectionDirect,
    handleViewConnectionDirect,
    handleDeleteConnectionDirect,
    handleRefreshConnectionDirect,
    handleClearStreamsDirect,

    // Add connection
    handleAddConnection,
    sourceIdForNewConnection,
    setSourceIdForNewConnection,
  };
}

import { Box, Typography } from '@mui/material';
import DestinationForm from '@/components/Destinations/DestinationForm';
import { SourceForm } from '@/components/Sources/SourceForm';
import CreateConnectionForm from '@/components/Connections/CreateConnectionForm';
import { StreamSelectionDialog } from '@/components/Connections/StreamSelectionDialog';
import ConfirmationDialog from '@/components/Dialog/ConfirmationDialog';
import { ConnectionSyncHistory } from '@/components/Connections/ConnectionSyncHistory';
import SchemaChangeDetailsForm from '@/components/Connections/SchemaChangeDetailsForm';
import { LogCard } from '@/components/Logs/LogCard';
import { useIngestData } from './useIngestData';
import { warehouseContainerSx, colors } from './ingestStyles';
import WarehouseHeader from './WarehouseHeader';
import WarehouseDetailsPanel from './WarehouseDetailsPanel';
import SearchToolbar from './SearchToolbar';
import SourceTable from './SourceTable';
import EmptyState from './EmptyState';

export default function UnifiedIngestionView() {
  const data = useIngestData();

  return (
    <Box>
      {/* View history dialog */}
      {data.showLogsDialog && (
        <ConnectionSyncHistory
          setShowLogsDialog={data.setShowLogsDialog}
          connection={data.logsConnection}
        />
      )}

      {/* ====== WAREHOUSE CONTAINER ====== */}
      <Box sx={warehouseContainerSx}>
        {/* Warehouse Header (gradient bar) */}
        <WarehouseHeader
          warehouse={data.warehouse}
          warehouseLoading={data.warehouseLoading}
          showDetails={data.showWarehouseDetails}
          onToggleDetails={() => data.setShowWarehouseDetails((prev: boolean) => !prev)}
          onAddWarehouse={() => data.setShowWarehouseDialog(true)}
          permissions={data.permissions}
          isDemo={data.isDemo}
        />

        {/* Warehouse Details Panel (expandable) */}
        {data.warehouse && (
          <WarehouseDetailsPanel
            warehouse={data.warehouse}
            showDetails={data.showWarehouseDetails}
            permissions={data.permissions}
            isDemo={data.isDemo}
            onEdit={() => data.setShowWarehouseDialog(true)}
            onDelete={() => data.setShowDeleteWarehouseDialog(true)}
          />
        )}

        {/* Search + Add Source toolbar */}
        <SearchToolbar
          searchText={data.searchText}
          onSearchChange={data.setSearchText}
          onAddSource={() => {
            data.setSourceIdToEdit('');
            data.setShowSourceDialog(true);
          }}
          canCreateSource={data.permissions.includes('can_create_source')}
        />

        {/* Main Table or Empty State */}
        {data.isLoading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: colors.textTertiary }}>
              Loading...
            </Typography>
          </Box>
        ) : data.filteredGroups.length === 0 ? (
          <EmptyState
            searchText={data.searchText}
            onAddSource={() => {
              data.setSourceIdToEdit('');
              data.setShowSourceDialog(true);
            }}
            canCreateSource={data.permissions.includes('can_create_source')}
          />
        ) : (
          <SourceTable
            groups={data.filteredGroups}
            schemaChanges={data.schemaChanges}
            isSourceNew={data.isSourceNew}
            isConnectionNew={data.isConnectionNew}
            onAddConnection={data.handleAddConnection}
            onSchemaReview={(connectionId) => {
              data.setSchemaChangeConnectionId(connectionId);
              data.setShowSchemaChangeDialog(true);
            }}
            onViewHistory={(conn) => {
              data.setShowLogsDialog(true);
              data.setLogsConnection(conn);
              data.trackAmplitudeEvent('[View history] Button clicked');
            }}
            onEditSource={data.handleEditSourceDirect}
            onDeleteSource={data.handleDeleteSourceDirect}
            onEditConnection={data.handleEditConnectionDirect}
            onDeleteConnection={data.handleDeleteConnectionDirect}
            onRefreshSchema={data.handleRefreshConnectionDirect}
            onClearStreams={data.handleClearStreamsDirect}
            onViewConnection={data.handleViewConnectionDirect}
            permissions={data.permissions}
            isDemo={data.isDemo}
            syncingConnectionIds={data.syncingConnectionIds}
            setSyncingConnectionIds={data.setSyncingConnectionIds}
            syncConnection={data.syncConnection}
            trackAmplitudeEvent={data.trackAmplitudeEvent}
          />
        )}
      </Box>

      {/* LogCard at bottom */}
      <Box sx={{ mt: 3 }}>
        <LogCard
          logs={data.syncLogs}
          expand={data.expandSyncLogs}
          setExpand={data.setExpandSyncLogs}
        />
      </Box>

      {/* --- Dialogs --- */}
      <DestinationForm
        showForm={data.showWarehouseDialog}
        setShowForm={data.setShowWarehouseDialog}
        warehouse={data.warehouse}
        mutate={data.mutateWarehouse}
      />
      <SourceForm
        mutate={() => {
          data.mutateSources();
          data.mutateConnections();
        }}
        loading={data.sourceFormLoading}
        setLoading={data.setSourceFormLoading}
        sourceDefs={data.sourceDefs}
        showForm={data.showSourceDialog}
        setShowForm={data.setShowSourceDialog}
        sourceId={data.sourceIdToEdit}
      />
      <CreateConnectionForm
        connectionId={data.connectionIdToEdit}
        setConnectionId={data.setConnectionIdToEdit}
        mutate={data.mutateConnections}
        showForm={data.showConnectionDialog}
        setShowForm={(show: boolean) => {
          data.setShowConnectionDialog(show);
          if (!show) data.setSourceIdForNewConnection('');
        }}
        readonly={data.connectionViewMode}
        preselectedSourceId={data.sourceIdForNewConnection}
      />
      <ConfirmationDialog
        loading={data.deleteSourceLoading}
        show={data.showDeleteSourceDialog}
        handleClose={() => {
          data.setShowDeleteSourceDialog(false);
        }}
        handleConfirm={data.deleteSource}
        message="This will delete the source permanently and all connections related to it."
      />
      <ConfirmationDialog
        loading={data.deleteConnLoading}
        show={data.showDeleteConnDialog}
        handleClose={() => {
          data.setShowDeleteConnDialog(false);
        }}
        handleConfirm={data.deleteConnection}
        message="This will delete the connection permanently and all the flows built on top of this."
      />
      <ConfirmationDialog
        loading={data.deleteWarehouseLoading}
        show={data.showDeleteWarehouseDialog}
        handleClose={() => {
          data.setShowDeleteWarehouseDialog(false);
        }}
        handleConfirm={data.deleteWarehouse}
        message="Deleting the warehouse will also delete all the connections, flows and the dbt repo."
      />
      <StreamSelectionDialog
        open={data.showStreamSelectionDialog}
        onClose={() => data.setShowStreamSelectionDialog(false)}
        onConfirm={data.handleStreamSelectionConfirm}
        connectionId={data.connMenuConnectionId}
      />
      <ConfirmationDialog
        loading={data.clearStreamsLoading}
        show={data.showConfirmClearStreamsDialog}
        handleClose={() => {
          data.setShowConfirmClearStreamsDialog(false);
        }}
        handleConfirm={data.handleConfirmClearStreams}
        message={`This will clear data for ${data.selectedStreamsForClear.length} selected stream(s) from the destination. This action cannot be undone.`}
      />
      <SchemaChangeDetailsForm
        connectionId={data.schemaChangeConnectionId}
        refreshConnectionsList={data.mutateConnections}
        showForm={data.showSchemaChangeDialog}
        setShowForm={data.setShowSchemaChangeDialog}
        setConnectionId={data.setSchemaChangeConnectionId}
        fetchPendingActions={data.fetchSchemaChanges}
      />
    </Box>
  );
}

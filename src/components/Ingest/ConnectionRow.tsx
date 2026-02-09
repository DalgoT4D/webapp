import { Box, Button, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Connection } from '@/components/Connections/Connections';
import SchemaChangeBadge from './SchemaChangeBadge';
import SyncStatusCell from './SyncStatusCell';
import ConnectionSyncButton from './ConnectionSyncButton';
import { colors, labeledActionButtonSx, deleteActionButtonSx } from './ingestStyles';

interface ConnectionRowProps {
  connection: Connection;
  schemaChangeType?: string;
  isLastConnection: boolean;
  isHovered: boolean;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onAddConnection: () => void;
  onSchemaReview: (connectionId: string) => void;
  onViewHistory: () => void;
  onEditConnection: () => void;
  onDeleteConnection: () => void;
  onRefreshSchema: () => void;
  onClearStreams: () => void;
  onViewConnection: () => void;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
  hasResetPermission: boolean;
  permissions: string[];
  isDemo: boolean | undefined;
  syncingConnectionIds: string[];
  setSyncingConnectionIds: React.Dispatch<React.SetStateAction<string[]>>;
  syncConnection: (deploymentId: string, connectionId: string) => Promise<any>;
  trackAmplitudeEvent: (event: string) => void;
  isNew: boolean;
}

export default function ConnectionRow({
  connection,
  schemaChangeType,
  isLastConnection,
  isHovered,
  onHoverEnter,
  onHoverLeave,
  onAddConnection,
  onSchemaReview,
  onViewHistory,
  onEditConnection,
  onDeleteConnection,
  onRefreshSchema,
  onClearStreams,
  onViewConnection,
  hasEditPermission,
  hasDeletePermission,
  hasResetPermission,
  permissions,
  isDemo,
  syncingConnectionIds,
  setSyncingConnectionIds,
  syncConnection,
  trackAmplitudeEvent,
  isNew,
}: ConnectionRowProps) {
  const isSyncing = !!connection.lock || syncingConnectionIds.includes(connection.connectionId);

  return (
    <Box
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      sx={{
        display: 'grid',
        gridTemplateColumns: '7fr 3fr 3fr',
        alignItems: 'start',
        py: 1.5,
        px: 2,
        backgroundColor: isHovered ? 'rgba(0, 137, 123, 0.04)' : 'transparent',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* Connection name + action buttons */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
          {connection.name}
        </Typography>

        {schemaChangeType && (
          <SchemaChangeBadge
            changeType={schemaChangeType}
            onReview={() => onSchemaReview(connection.connectionId)}
            disabled={isSyncing}
          />
        )}

        {/* Action buttons — fade in on hover */}
        {!isDemo && (
          <Box
            sx={{
              mt: 0.75,
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.25s ease',
              pointerEvents: isHovered ? 'auto' : 'none',
            }}
          >
            {isSyncing ? (
              <Tooltip title="View this connection's configuration (read-only while syncing)" arrow>
                <span>
                  <Button
                    size="small"
                    startIcon={<VisibilityOutlinedIcon />}
                    sx={labeledActionButtonSx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewConnection();
                    }}
                  >
                    View
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <>
                <Tooltip title="Edit this connection's settings and stream configuration" arrow>
                  <span>
                    <Button
                      size="small"
                      startIcon={<EditOutlinedIcon />}
                      sx={labeledActionButtonSx}
                      disabled={!hasEditPermission}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditConnection();
                      }}
                    >
                      Edit
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Permanently delete this connection and all flows built on it" arrow>
                  <span>
                    <Button
                      size="small"
                      startIcon={<DeleteOutlineIcon />}
                      sx={deleteActionButtonSx}
                      disabled={!hasDeletePermission}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConnection();
                      }}
                    >
                      Delete
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Check the source for any structural changes in your data" arrow>
                  <span>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      sx={labeledActionButtonSx}
                      disabled={!hasEditPermission}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefreshSchema();
                      }}
                    >
                      Refresh Schema
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title="Clear synced data for selected streams from your warehouse. Use this to re-sync fresh data from scratch."
                  arrow
                >
                  <span>
                    <Button
                      size="small"
                      startIcon={<RestartAltIcon />}
                      sx={labeledActionButtonSx}
                      disabled={!hasResetPermission}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearStreams();
                      }}
                    >
                      Clear
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
          </Box>
        )}

        {isLastConnection && permissions.includes('can_create_connection') && (
          <Box
            sx={{
              mt: 0.75,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.25s ease',
              pointerEvents: isHovered ? 'auto' : 'none',
            }}
          >
            <Typography
              variant="body2"
              onClick={onAddConnection}
              sx={{
                color: colors.primary,
                cursor: 'pointer',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              + Add Connection
            </Typography>
          </Box>
        )}
      </Box>

      {/* Sync status */}
      <Box>
        <SyncStatusCell
          connection={connection}
          syncingConnectionIds={syncingConnectionIds}
          onViewHistory={onViewHistory}
        />
      </Box>

      {/* Sync button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start' }}>
        <ConnectionSyncButton
          connection={connection}
          permissions={permissions}
          syncingConnectionIds={syncingConnectionIds}
          setSyncingConnectionIds={setSyncingConnectionIds}
          syncConnection={syncConnection}
          trackAmplitudeEvent={trackAmplitudeEvent}
          isNew={isNew}
        />
      </Box>
    </Box>
  );
}

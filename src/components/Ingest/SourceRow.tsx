import { useState, useRef, useCallback } from 'react';
import { TableCell, TableRow, Typography } from '@mui/material';
import { Connection } from '@/components/Connections/Connections';
import { SourceGroup } from './useIngestData';
import SourceCell from './SourceCell';
import ConnectionRow from './ConnectionRow';
import { colors, pulseGlowSx } from './ingestStyles';

interface SourceRowProps {
  group: SourceGroup;
  isSourceNew: boolean;
  isConnectionNew: (connectionId: string) => boolean;
  schemaChanges: Record<string, string>;
  onAddConnection: (sourceId: string) => void;
  onSchemaReview: (connectionId: string) => void;
  onViewHistory: (connection: Connection) => void;
  onEditSource: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
  onEditConnection: (connectionId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onRefreshSchema: (connectionId: string) => void;
  onClearStreams: (connectionId: string, clearDeploymentId: string | null) => void;
  onViewConnection: (connectionId: string) => void;
  permissions: string[];
  isDemo: boolean | undefined;
  syncingConnectionIds: string[];
  setSyncingConnectionIds: React.Dispatch<React.SetStateAction<string[]>>;
  syncConnection: (deploymentId: string, connectionId: string) => Promise<any>;
  trackAmplitudeEvent: (event: string) => void;
}

export default function SourceRow({
  group,
  isSourceNew,
  isConnectionNew,
  schemaChanges,
  onAddConnection,
  onSchemaReview,
  onViewHistory,
  onEditSource,
  onDeleteSource,
  onEditConnection,
  onDeleteConnection,
  onRefreshSchema,
  onClearStreams,
  onViewConnection,
  permissions,
  isDemo,
  syncingConnectionIds,
  setSyncingConnectionIds,
  syncConnection,
  trackAmplitudeEvent,
}: SourceRowProps) {
  const { source, sourceDefLabel, dockerTag, connections } = group;

  // Group-level hover — controls the left accent border
  const [isGroupHovered, setIsGroupHovered] = useState(false);
  const groupLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGroupMouseEnter = useCallback(() => {
    if (groupLeaveRef.current) {
      clearTimeout(groupLeaveRef.current);
      groupLeaveRef.current = null;
    }
    setIsGroupHovered(true);
  }, []);

  const handleGroupMouseLeave = useCallback(() => {
    groupLeaveRef.current = setTimeout(() => {
      setIsGroupHovered(false);
    }, 50);
  }, []);

  // Connection-level hover — highlights individual connection
  const [hoveredConnIdx, setHoveredConnIdx] = useState<number | null>(null);
  const connLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConnMouseEnter = useCallback((idx: number) => {
    if (connLeaveRef.current) {
      clearTimeout(connLeaveRef.current);
      connLeaveRef.current = null;
    }
    setHoveredConnIdx(idx);
  }, []);

  const handleConnMouseLeave = useCallback(() => {
    connLeaveRef.current = setTimeout(() => {
      setHoveredConnIdx(null);
    }, 50);
  }, []);

  // Card border
  const cardBorder = `1px solid ${colors.borderLight}`;
  const leftBorder = `3px solid ${isGroupHovered ? colors.primary : 'transparent'}`;

  // Source cell — left accent + card top/bottom, vertically centered
  const sourceCellSx = {
    borderLeft: leftBorder,
    borderTop: cardBorder,
    borderBottom: cardBorder,
    borderRight: 'none',
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
    py: 2,
    px: 2,
    verticalAlign: 'middle',
    backgroundColor: colors.white,
    transition: 'border-color 0.25s ease',
    '& .hover-actions': {
      opacity: 0,
      transition: 'opacity 0.25s ease',
    },
    '&:hover .hover-actions': {
      opacity: 1,
    },
  };

  // Connections cell — card top/bottom/right, stacks connections vertically
  const connectionsCellSx = {
    borderTop: cardBorder,
    borderBottom: cardBorder,
    borderRight: cardBorder,
    borderLeft: 'none',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    p: 0,
    verticalAlign: 'top',
    backgroundColor: colors.white,
  };

  // No connections — single-row card with placeholders
  if (connections.length === 0) {
    const middleCellSx = {
      borderTop: cardBorder,
      borderBottom: cardBorder,
      borderLeft: 'none',
      borderRight: 'none',
      py: 2,
      verticalAlign: 'middle' as const,
      backgroundColor: colors.white,
    };

    const lastCellSx = {
      ...middleCellSx,
      borderRight: cardBorder,
      borderTopRightRadius: '8px',
      borderBottomRightRadius: '8px',
    };

    return (
      <TableRow onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave}>
        <TableCell sx={sourceCellSx}>
          <SourceCell
            name={source.name}
            sourceType={sourceDefLabel}
            dockerTag={dockerTag}
            sourceIcon={source.icon}
            showMenu={!isDemo}
            onEditSource={() => onEditSource(source.sourceId)}
            onDeleteSource={() => onDeleteSource(source.sourceId)}
            hasEditPermission={permissions.includes('can_edit_source')}
            hasDeletePermission={permissions.includes('can_delete_source')}
          />
        </TableCell>
        <TableCell sx={middleCellSx}>
          <Typography variant="body2" sx={{ color: colors.textTertiary }}>
            Connect this source to your warehouse
          </Typography>
          {permissions.includes('can_create_connection') && (
            <Typography
              variant="body2"
              onClick={() => onAddConnection(source.sourceId)}
              sx={{
                color: colors.primary,
                cursor: 'pointer',
                fontWeight: 600,
                mt: 0.5,
                borderRadius: '4px',
                display: 'inline-block',
                px: 0.5,
                '&:hover': { textDecoration: 'underline' },
                ...(isSourceNew ? pulseGlowSx : {}),
              }}
            >
              + Add Connection
            </Typography>
          )}
        </TableCell>
        <TableCell sx={middleCellSx}>
          <Typography variant="body2" sx={{ color: colors.textTertiary }}>
            —
          </Typography>
        </TableCell>
        <TableCell sx={lastCellSx}>
          <Typography variant="body2" sx={{ color: colors.textTertiary }}>
            —
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  // Source with connections — single TableRow, connections stacked in colSpan cell
  return (
    <TableRow onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave}>
      <TableCell sx={sourceCellSx}>
        <SourceCell
          name={source.name}
          sourceType={sourceDefLabel}
          dockerTag={dockerTag}
          sourceIcon={source.icon}
          showMenu={!isDemo}
          onEditSource={() => onEditSource(source.sourceId)}
          onDeleteSource={() => onDeleteSource(source.sourceId)}
          hasEditPermission={permissions.includes('can_edit_source')}
          hasDeletePermission={permissions.includes('can_delete_source')}
        />
      </TableCell>
      <TableCell colSpan={3} sx={connectionsCellSx}>
        {connections.map((conn, idx) => (
          <ConnectionRow
            key={conn.connectionId}
            connection={conn}
            schemaChangeType={schemaChanges[conn.connectionId]}
            isLastConnection={idx === connections.length - 1}
            isHovered={hoveredConnIdx === idx}
            onHoverEnter={() => handleConnMouseEnter(idx)}
            onHoverLeave={handleConnMouseLeave}
            onAddConnection={() => onAddConnection(source.sourceId)}
            onSchemaReview={onSchemaReview}
            onViewHistory={() => onViewHistory(conn)}
            onEditConnection={() => onEditConnection(conn.connectionId)}
            onDeleteConnection={() => onDeleteConnection(conn.connectionId)}
            onRefreshSchema={() => onRefreshSchema(conn.connectionId)}
            onClearStreams={() => onClearStreams(conn.connectionId, conn.clearConnDeploymentId)}
            onViewConnection={() => onViewConnection(conn.connectionId)}
            hasEditPermission={permissions.includes('can_edit_connection')}
            hasDeletePermission={permissions.includes('can_delete_connection')}
            hasResetPermission={permissions.includes('can_reset_connection')}
            permissions={permissions}
            isDemo={isDemo}
            syncingConnectionIds={syncingConnectionIds}
            setSyncingConnectionIds={setSyncingConnectionIds}
            syncConnection={syncConnection}
            trackAmplitudeEvent={trackAmplitudeEvent}
            isNew={isConnectionNew(conn.connectionId)}
          />
        ))}
      </TableCell>
    </TableRow>
  );
}

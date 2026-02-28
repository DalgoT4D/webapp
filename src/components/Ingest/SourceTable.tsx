import { Fragment } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Connection } from '@/components/Connections/Connections';
import { SourceGroup } from './useIngestData';
import SourceRow from './SourceRow';
import { colors } from './ingestStyles';

interface SourceTableProps {
  groups: SourceGroup[];
  schemaChanges: Record<string, string>;
  isSourceNew: (sourceId: string) => boolean;
  isConnectionNew: (connectionId: string) => boolean;
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

const headerCellSx = {
  fontWeight: 700,
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: '0.75rem',
  backgroundColor: colors.warmGrey,
  borderBottom: 'none',
  py: 1.5,
  px: 2,
};

const headerTypoSx = {
  fontWeight: 700,
  color: colors.textSecondary,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '0.75rem',
};

export default function SourceTable({
  groups,
  schemaChanges,
  isSourceNew,
  isConnectionNew,
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
}: SourceTableProps) {
  return (
    <TableContainer sx={{ background: colors.warmGrey, boxShadow: 'none' }}>
      <Table
        sx={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          '& .MuiTableCell-root': {
            borderBottom: 'none',
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headerCellSx, width: '35%' }}>
              <Tooltip
                title="A source is where your data comes from — like a spreadsheet, database, or app (e.g., Google Sheets, Salesforce)"
                arrow
              >
                <Box
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}
                >
                  <Typography variant="body2" sx={headerTypoSx}>
                    Source
                  </Typography>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: colors.textTertiary }} />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell sx={{ ...headerCellSx, width: '35%' }}>
              <Tooltip
                title="A connection links a source to your warehouse. It defines which data to bring in and how often to sync it."
                arrow
              >
                <Box
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}
                >
                  <Typography variant="body2" sx={headerTypoSx}>
                    Connection
                  </Typography>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: colors.textTertiary }} />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell sx={{ ...headerCellSx, width: '15%' }}>
              <Tooltip
                title="Shows when data was last copied from the source to your warehouse, and whether it succeeded or failed"
                arrow
              >
                <Box
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}
                >
                  <Typography variant="body2" sx={headerTypoSx}>
                    Last Sync
                  </Typography>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: colors.textTertiary }} />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell sx={{ ...headerCellSx, width: '15%' }}>
              <Tooltip
                title="Click Sync to start copying the latest data from your source into your warehouse"
                arrow
              >
                <Box
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}
                >
                  <Typography variant="body2" sx={headerTypoSx}>
                    Actions
                  </Typography>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: colors.textTertiary }} />
                </Box>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group, groupIdx) => (
            <Fragment key={group.source.sourceId}>
              {/* Spacer row between source groups */}
              {groupIdx > 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ border: 'none', p: 0, background: 'transparent' }}>
                    <Box sx={{ height: 16 }} />
                  </TableCell>
                </TableRow>
              )}
              <SourceRow
                group={group}
                isSourceNew={isSourceNew(group.source.sourceId)}
                isConnectionNew={isConnectionNew}
                schemaChanges={schemaChanges}
                onAddConnection={onAddConnection}
                onSchemaReview={onSchemaReview}
                onViewHistory={onViewHistory}
                onEditSource={onEditSource}
                onDeleteSource={onDeleteSource}
                onEditConnection={onEditConnection}
                onDeleteConnection={onDeleteConnection}
                onRefreshSchema={onRefreshSchema}
                onClearStreams={onClearStreams}
                onViewConnection={onViewConnection}
                permissions={permissions}
                isDemo={isDemo}
                syncingConnectionIds={syncingConnectionIds}
                setSyncingConnectionIds={setSyncingConnectionIds}
                syncConnection={syncConnection}
                trackAmplitudeEvent={trackAmplitudeEvent}
              />
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

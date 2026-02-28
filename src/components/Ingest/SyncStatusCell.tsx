import { Box, Tooltip, Typography } from '@mui/material';
import { Connection } from '@/components/Connections/Connections';
import { AIRBYTE_JOB_STATUS_SUCCEEDED, AIRBYTE_JOB_STATUS_CANCELED } from '@/config/constant';
import { lastRunTime, trimEmail } from '@/utils/common';
import StatusIcon from './StatusIcon';
import { colors, statusChipSx } from './ingestStyles';

interface SyncStatusCellProps {
  connection: Connection;
  syncingConnectionIds: string[];
  onViewHistory: () => void;
}

export default function SyncStatusCell({
  connection,
  syncingConnectionIds,
  onViewHistory,
}: SyncStatusCellProps) {
  const { lock, lastRun } = connection;

  let jobStatus: string | null = null;
  let jobStatusColor = colors.textTertiary;

  if (lock?.status === 'running') {
    jobStatus = 'running';
    jobStatusColor = colors.primary;
  } else if (lock?.status === 'cancelled') {
    jobStatus = 'cancelled';
    jobStatusColor = colors.warningAmber;
  } else if (lock?.status === 'locked' || lock?.status === 'complete') {
    jobStatus = 'locked';
    jobStatusColor = colors.textTertiary;
  } else if (syncingConnectionIds.includes(connection.connectionId) || lock?.status === 'queued') {
    jobStatus = 'queued';
    jobStatusColor = colors.primary;
  }

  if (jobStatus === null && lastRun) {
    if (lastRun.status === AIRBYTE_JOB_STATUS_SUCCEEDED) {
      jobStatus = 'success';
      jobStatusColor = colors.successGreen;
    } else if (lastRun.status === AIRBYTE_JOB_STATUS_CANCELED) {
      jobStatus = 'cancelled';
      jobStatusColor = colors.warningAmber;
    } else {
      jobStatus = 'failed';
      jobStatusColor = colors.errorRed;
    }
  }

  if (!jobStatus && !lastRun) {
    return (
      <Typography variant="body2" sx={{ color: colors.textTertiary, fontStyle: 'italic' }}>
        Never synced
      </Typography>
    );
  }

  const chipStyle =
    jobStatus && statusChipSx[jobStatus as keyof typeof statusChipSx]
      ? statusChipSx[jobStatus as keyof typeof statusChipSx]
      : {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Time info */}
      {jobStatus &&
        (['success', 'failed', 'cancelled'].includes(jobStatus) ? (
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary }}>
            {lastRunTime(lastRun?.startTime)}
          </Typography>
        ) : (
          lock && (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textSecondary }}>
                Triggered by: {trimEmail(lock.lockedBy)}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: colors.textTertiary }}>
                {lastRunTime(lock.lockedAt)}
              </Typography>
            </>
          )
        ))}

      {/* Status chip */}
      {jobStatus && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            px: 1,
            py: 0.25,
            borderRadius: '6px',
            width: 'fit-content',
            ...chipStyle,
          }}
        >
          <StatusIcon
            sx={{ fontSize: 16, color: jobStatusColor }}
            status={jobStatus}
            queueInfo={connection.queuedFlowRunWaitTime}
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: jobStatusColor, fontSize: '0.8rem' }}
          >
            {jobStatus}
          </Typography>
        </Box>
      )}

      {/* View history link */}
      {jobStatus && (
        <Tooltip
          title="See the complete history of past data syncs, including how much data was copied each time"
          arrow
        >
          <Typography
            variant="body2"
            onClick={onViewHistory}
            sx={{
              color: colors.primary,
              cursor: 'pointer',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
              mt: 0.25,
              width: 'fit-content',
            }}
          >
            View history
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}

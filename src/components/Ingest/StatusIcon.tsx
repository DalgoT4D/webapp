import { memo } from 'react';
import LoopIcon from '@mui/icons-material/Loop';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';
import CancelIcon from '@/assets/icons/cancel';
import { QueueTooltip } from '@/components/Connections/Connections';

interface StatusIconProps {
  sx: any;
  status: string | null;
  queueInfo: any;
}

const StatusIcon = memo(function StatusIcon({ sx, status, queueInfo }: StatusIconProps) {
  if (status === null) return null;
  if (status === 'running') return <LoopIcon sx={sx} />;
  if (status === 'cancelled') return <CancelIcon sx={sx} />;
  if (status === 'locked') return <LockIcon sx={sx} />;
  if (status === 'queued') return <QueueTooltip queueInfo={queueInfo} />;
  if (status === 'success') return <TaskAltIcon sx={sx} />;
  if (status === 'failed') return <WarningAmberIcon sx={sx} />;
  return null;
});

export default StatusIcon;

import { useState, useContext } from 'react';
import { Box, Button } from '@mui/material';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { Connection } from '@/components/Connections/Connections';
import { useSyncLock } from '@/customHooks/useSyncLock';
import { delay } from '@/utils/common';
import SyncIcon from '@/assets/icons/sync.svg';
import styles from '@/styles/Common.module.css';
import { pulseGlowSx } from './ingestStyles';

interface ConnectionSyncButtonProps {
  connection: Connection;
  permissions: string[];
  syncingConnectionIds: string[];
  setSyncingConnectionIds: React.Dispatch<React.SetStateAction<string[]>>;
  syncConnection: (deploymentId: string, connectionId: string) => Promise<any>;
  trackAmplitudeEvent: (event: string) => void;
  isNew?: boolean;
}

export default function ConnectionSyncButton({
  connection,
  permissions,
  syncingConnectionIds,
  setSyncingConnectionIds,
  syncConnection,
  trackAmplitudeEvent,
  isNew = false,
}: ConnectionSyncButtonProps) {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const { deploymentId, connectionId, lock } = connection;
  const { tempSyncState, setTempSyncState } = useSyncLock(lock);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleSync = async () => {
    setTempSyncState(true);
    trackAmplitudeEvent('[Sync-connection] Button Clicked');
    if (!syncingConnectionIds.includes(connectionId)) {
      setSyncingConnectionIds((prev) => [...prev, connectionId]);
    }
    const res = await syncConnection(deploymentId, connectionId);
    if (res?.error === 'ERROR') {
      setTempSyncState(false);
    }
  };

  const handleCancelSync = async (flowRunId: string) => {
    setCancelLoading(true);
    try {
      const res = await httpPost(session, `prefect/flow_runs/${flowRunId}/set_state`, {
        state: { name: 'Cancelling', type: 'CANCELLING' },
        force: true,
      });
      if (!res.success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
      successToast('Queued job cancelled successfully', [], globalContext);
    } catch (error: any) {
      errorToast(error.message, [], globalContext);
    } finally {
      await delay(6000);
      setCancelLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      {lock?.status === 'queued' && lock?.flowRunId && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleCancelSync(lock.flowRunId as string)}
          disabled={cancelLoading}
          sx={{ borderRadius: '8px', fontWeight: 700 }}
        >
          Cancel
        </Button>
      )}
      <Button
        variant="contained"
        size="small"
        onClick={handleSync}
        disabled={tempSyncState || !!lock || !permissions.includes('can_sync_sources')}
        sx={{
          borderRadius: '8px',
          px: 2,
          fontWeight: 700,
          ...(isNew && !connection.lastRun && !lock && !tempSyncState ? pulseGlowSx : {}),
        }}
      >
        {tempSyncState || lock ? (
          <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
        ) : (
          'Sync'
        )}
      </Button>
    </Box>
  );
}

import { useEffect, useRef, useState } from 'react';

type LockStatus = 'running' | 'queued' | 'locked' | null;
export const useSyncLock = (lock: any) => {
  const [tempSyncState, setTempSyncState] = useState(false); //on polling it will set to false automatically. //local state of each button.
  //side Effect is because the lock state keeps on changing during polling.
  const lockLastStateRef = useRef<LockStatus>(null);
  //using ref because the value of lock is null both in starting and end.
  //so to store the value before it becomes null again.
  useEffect(() => {
    if (lock) {
      if (lock.status === 'running') {
        lockLastStateRef.current = 'running';
      } else if (lock.status === 'queued') {
        lockLastStateRef.current = 'queued';
      } else if (lock.status === 'locked' || lock?.status === 'complete') {
        lockLastStateRef.current = 'locked';
      }
    }

    //when polling ends, resets state.
    if (!lock && lockLastStateRef.current && tempSyncState) {
      setTempSyncState(false);

      lockLastStateRef.current = null;
    }
  }, [lock]);

  return { tempSyncState, setTempSyncState };
};

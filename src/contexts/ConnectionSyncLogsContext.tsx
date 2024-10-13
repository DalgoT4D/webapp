import React, { useState, useContext, Dispatch, SetStateAction } from 'react';

const ConnectionSyncLogsContext = React.createContext<string[]>([]);
const ConnectionSyncLogsUpdateContext = React.createContext<Dispatch<SetStateAction<string[]>>>(
  (() => {}) as Dispatch<SetStateAction<string[]>>
);

export const useConnSyncLogs = () => {
  return useContext(ConnectionSyncLogsContext);
};

export const useConnSyncLogsUpdate = () => {
  return useContext(ConnectionSyncLogsUpdateContext);
};

export const ConnectionSyncLogsProvider = ({ children }: any) => {
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  return (
    <ConnectionSyncLogsContext.Provider value={syncLogs}>
      <ConnectionSyncLogsUpdateContext.Provider value={setSyncLogs}>
        {children}
      </ConnectionSyncLogsUpdateContext.Provider>
    </ConnectionSyncLogsContext.Provider>
  );
};

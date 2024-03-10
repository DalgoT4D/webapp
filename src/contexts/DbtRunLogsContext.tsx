import React, { useState, useContext, Dispatch, SetStateAction } from 'react';

const DbtRunLogsContext = React.createContext<string[]>([]);
const DbtRunLogsUpdateContext = React.createContext<
  Dispatch<SetStateAction<string[]>>
>((() => {}) as Dispatch<SetStateAction<string[]>>);

export const useDbtRunLogs = () => {
  return useContext(DbtRunLogsContext);
};

export const useDbtRunLogsUpdate = () => {
  return useContext(DbtRunLogsUpdateContext);
};

export const DbtRunLogsProvider = ({ children }: any) => {
  const [dbtRunLogs, setDbtRunLogs] = useState<string[]>([]);

  return (
    <DbtRunLogsContext.Provider value={dbtRunLogs}>
      <DbtRunLogsUpdateContext.Provider value={setDbtRunLogs}>
        {children}
      </DbtRunLogsUpdateContext.Provider>
    </DbtRunLogsContext.Provider>
  );
};

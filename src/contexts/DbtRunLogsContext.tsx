import React, { useState, useContext, Dispatch, SetStateAction } from 'react';

import { PrefectFlowRunLog } from '@/components/DBT/DBTTarget';

const DbtRunLogsContext = React.createContext<PrefectFlowRunLog[]>([]);
const DbtRunLogsUpdateContext = React.createContext<
  Dispatch<SetStateAction<PrefectFlowRunLog[]>>
>((() => {}) as Dispatch<SetStateAction<PrefectFlowRunLog[]>>);

export const useDbtRunLogs = () => {
  return useContext(DbtRunLogsContext);
};

export const useDbtRunLogsUpdate = () => {
  return useContext(DbtRunLogsUpdateContext);
};

export const DbtRunLogsProvider = ({ children }: any) => {
  const [dbtRunLogs, setDbtRunLogs] = useState<PrefectFlowRunLog[]>([]);

  return (
    <DbtRunLogsContext.Provider value={dbtRunLogs}>
      <DbtRunLogsUpdateContext.Provider value={setDbtRunLogs}>
        {children}
      </DbtRunLogsUpdateContext.Provider>
    </DbtRunLogsContext.Provider>
  );
};

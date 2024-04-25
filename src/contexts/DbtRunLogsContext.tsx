import React, { useState, useContext, Dispatch, SetStateAction } from 'react';

import { TaskProgressLog } from '@/components/TransformWorkflow/FlowEditor/FlowEditor';

const DbtRunLogsContext = React.createContext<TaskProgressLog[]>([]);
const DbtRunLogsUpdateContext = React.createContext<
  Dispatch<SetStateAction<TaskProgressLog[]>>
>((() => {}) as Dispatch<SetStateAction<TaskProgressLog[]>>);

export const useDbtRunLogs = () => {
  return useContext(DbtRunLogsContext);
};

export const useDbtRunLogsUpdate = () => {
  return useContext(DbtRunLogsUpdateContext);
};

export const DbtRunLogsProvider = ({ children }: any) => {
  const [dbtRunLogs, setDbtRunLogs] = useState<TaskProgressLog[]>([]);

  return (
    <DbtRunLogsContext.Provider value={dbtRunLogs}>
      <DbtRunLogsUpdateContext.Provider value={setDbtRunLogs}>
        {children}
      </DbtRunLogsUpdateContext.Provider>
    </DbtRunLogsContext.Provider>
  );
};

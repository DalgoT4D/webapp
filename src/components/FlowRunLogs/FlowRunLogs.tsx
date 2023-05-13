/**
 * FlowRunLogs component
 * Shows the logs for a Prefect flow-run
 * Invoked via (insert your own flow-run-id below)
 *    <FlowRunLogs flowRunId="37bfef25-cb2f-4325-8bd7-db76fcd7c419" />
 */

import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useEffect } from 'react';

export const FlowRunLogs = ({ flowRunId }: any) => {

  const { data: session }: any = useSession();
  const [logs, setLogs] = useState<Array<logMessage>>([]);
  const [done, setDone] = useState<boolean>(false);

  type logMessage = {
    level: number;
    timestamp: string;
    message: string;
  };

  const fetchLogs = async () => {

    if (done) {
      return;
    }

    const offset = logs.length;
    const response = await fetch(`${backendUrl}/api/prefect/flow_runs/${flowRunId}/logs?offset=${offset}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    });

    if (response.ok) {
      const { logs: packet } = await response.json();
      // packet = {logs: [logMessage], offset: int}
      if (packet.logs.length > 0) {
        setLogs(logs.concat(packet.logs));
      } else {
        setDone(true);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <>
      <div style={{
        overflowY: "scroll",
        height: "50%",
        maxHeight: "50vh",
        paddingTop: "5px",
        paddingBottom: "5px",
        paddingLeft: "10px",
        paddingRight: "10px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "4px",
        borderColor: "#00897b",
      }}>
        <div style={{ fontWeight: 'bold' }}>Log Output</div>
        {
          logs && logs.length > 0 &&
          (
            <div>
              {
                logs.map((message: logMessage) =>
                  <div key={message.timestamp}>
                    {message.message}
                  </div>
                )
              }
            </div>
          )
        }
        {!done &&
          <div style={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={fetchLogs}>fetch more</div>
        }
        {done &&
          <div>-- End of logs --</div>
        }
      </div>
    </>
  );
};


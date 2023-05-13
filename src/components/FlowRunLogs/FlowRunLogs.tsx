/**
 * FlowRunLogs component
 * Shows the logs for a Prefect flow-run
 * Invoked via (insert your own flow-run-id below)
 *    <FlowRunLogs flowRunId="37bfef25-cb2f-4325-8bd7-db76fcd7c419" />
 */

import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export const FlowRunLogs = ({ flowRunId }: any) => {

  const { data: session }: any = useSession();
  const [logs, setLogs] = useState<Array<logMessage>>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  type logMessage = {
    level: number;
    timestamp: string;
    message: string;
  };

  const fetchLogs = async () => {

    await fetch(`${backendUrl}/api/prefect/flow_runs/${flowRunId}/logs`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {

      if (response.ok) {
        response.json().then(({ logs: packet }) => {
          // console.log(packet);
          setLogs(packet.logs);
          setHasMore(false);
        });
      } else {
        setHasMore(false);
      }
    });
  };

  if (hasMore) {
    fetchLogs();
  }

  return (
    <>
      <div style={{
        overflowY: "scroll",
        height: "100px",
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
      </div>
    </>
  );
};


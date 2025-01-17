import { generateWebsocketUrl } from '@/helpers/websocket';
import { Box, Divider, Tab, Tabs, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { ChatMessage } from './ChatInterface';

export enum ThreadStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export interface ThreadMeta {
  user_prompt: string;
  sql: string;
}

export interface Thread {
  session_id: string;
  uuid: string;
  status: string;
  meta: ThreadMeta;
  created_at: string;
  updated_at: string;
}

export const Threads = ({
  threads,
  setChatMessages,
  setCurrentThread,
  currentThread,
  setThreads,
}: {
  threads: Thread[];
  currentThread: Thread | null;
  setChatMessages: (...args: any) => any;
  setCurrentThread: (...args: any) => any;
  setThreads: (...args: any) => any;
}) => {
  const { data: session }: any = useSession();
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const {
    sendJsonMessage,
    lastJsonMessage,
  }: {
    sendJsonMessage: (...args: any) => any;
    lastJsonMessage: { data: any; status: string; message: string } | null;
  } = useWebSocket(socketUrl, {
    share: true,
    onError(event) {
      console.error('Socket error:', event);
    },
  });

  useEffect(() => {
    if (session) {
      setSocketUrl(generateWebsocketUrl('chat/bot', session));
    }
  }, [session]);

  useEffect(() => {
    // set the messages of current select thread
    if (lastJsonMessage && lastJsonMessage.data) {
      if (lastJsonMessage.data.messages) {
        setChatMessages(lastJsonMessage.data.messages);
      } else if (lastJsonMessage.data.threads) {
        setThreads(lastJsonMessage.data.threads);
      }
    }
  }, [lastJsonMessage]);

  const onSelectThread = (thread: Thread) => {
    // setValue('aiGeneratedSql', thread.meta.sql);
    // setValue('thread_uuid', thread.uuid);
    setCurrentThread(thread);
    sendJsonMessage({ action: 'get_messages', params: { thread_uuid: thread.uuid } });
  };

  return (
    <>
      <Box>
        <Typography variant="h4">Conversations</Typography>
        <Divider />

        {threads.length ? (
          <Tabs orientation="vertical" variant="scrollable">
            {threads.map((thread: Thread, index: number) => (
              <Tab
                dir="bottom"
                sx={{ border: currentThread?.uuid === thread.uuid ? '1px solid red' : 'none' }}
                key={index}
                label={thread.meta.user_prompt}
                onClick={() => {
                  onSelectThread(thread);
                }}
              />
            ))}
          </Tabs>
        ) : (
          <Typography variant="body1">No threads available</Typography>
        )}
      </Box>
    </>
  );
};

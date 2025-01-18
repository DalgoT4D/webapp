import { PageHead } from '@/components/PageHead';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Dialog,
  Divider,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useRef, useState } from 'react';
import { TopNavBar, Transition } from '@/components/DBT/DBTTransformType';
import { ResizableBox } from 'react-resizable';
import PreviewPane from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GenerateSql } from '@/components/DataAnalysis/chat_with_your_data/GenerateSql';
import { useForm } from 'react-hook-form';
import {
  ChatInterface,
  ChatMessage,
} from '@/components/DataAnalysis/chat_with_your_data/ChatInterface';
import { ExpandMore } from '@mui/icons-material';
import useWebSocket from 'react-use-websocket';
import { generateWebsocketUrl } from '@/helpers/websocket';
import {
  Thread,
  Threads,
  WebSocketResponseStatus,
} from '@/components/DataAnalysis/chat_with_your_data/Threads';
import PreviewPaneSql from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreivewPaneSql';

export default function Explore() {
  const { data: session } = useSession();
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // const [threads, setThreads] = useState<Thread[]>([]);
  const threads = useRef<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [refreshThreads, setRefreshThreads] = useState<boolean>(false); // just a toggle to refetch threads list

  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [width, setWidth] = useState(400);
  const [width_R, setWidth_R] = useState(400);

  const [height, setheight] = useState(500);
  const [height_R, setheight_R] = useState(500);

  const setThreads = (newThreads: Thread[]) => {
    threads.current = newThreads;
  };

  const onResize = (event: any, { size }: any) => {
    setWidth(size.width);
  };
  const onResize_R = (event: any, { size }: any) => {
    setWidth_R(size.width);
  };

  const { setValue, watch } = useForm({
    defaultValues: {
      aiGeneratedSql: '',
      tableData: [],
    },
  });

  const aiGeneratedSql = watch('aiGeneratedSql');
  const tableData = watch('tableData');

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
    const dialogBox = document.querySelector('.MuiDialog-container');

    if (dialogBox) {
      const fullHeight = dialogBox?.clientHeight - 100;
      setheight(fullHeight);
    }
  }, []);

  useEffect(() => {
    if (currentThread) {
      setValue('aiGeneratedSql', currentThread.meta.sql);
    }
  }, [currentThread]);

  const triggerRefreshThreads = () => {
    setRefreshThreads(!refreshThreads);
  };

  return (
    <>
      <PageHead title="Dalgo | Data Analysis" />
      <Dialog fullScreen open={dialogueOpen} TransitionComponent={Transition}>
        <TopNavBar
          handleClose={() => {
            setDialogueOpen(false);
            router.push('/pipeline/ingest');
          }}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            overflow: 'inherit',
            position: 'relative',
          }}
        >
          {/* LEFT SIDE TO VIEW THE THREADS */}
          <ResizableBox
            axis="x"
            width={width_R}
            onResize={onResize_R}
            minConstraints={[280, Infinity]}
            maxConstraints={[550, Infinity]}
            resizeHandles={['e']}
          >
            <Threads
              threads={threads.current}
              setThreads={setThreads}
              setChatMessages={setChatMessages}
              setCurrentThread={setCurrentThread}
              currentThread={currentThread}
              refreshThreads={refreshThreads}
            />
          </ResizableBox>

          <Divider orientation="vertical" sx={{ color: 'black' }} />

          <Box sx={{ width: `calc(100% - ${width}px)` }}>
            <Box>
              <Box sx={{ height: 'unset' }}>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                  >
                    <Typography component="span"> Chat With Your Data</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ChatInterface
                      chatMessages={chatMessages}
                      currentThread={currentThread}
                      setChatMessages={setChatMessages}
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>
            <Divider orientation="vertical" sx={{ color: 'black' }} />

            <ResizableBox
              axis="x"
              width={width}
              onResize={onResize}
              minConstraints={[280, Infinity]}
              maxConstraints={[550, Infinity]}
              resizeHandles={['w']}
            >
              {/* Here we will add the sql generated prompt and also the chat with your data thing. */}

              <Box>
                <PreviewPaneSql height={height} initialSqlString={currentThread?.meta.sql} />
              </Box>

              {/* <Box
                sx={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F5FAFA',
                  borderTop: '1px solid #CCCCCC',
                  borderBottom: '1px solid #CCCCCC',
                }}
              ></Box> */}
            </ResizableBox>
          </Box>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography component="span">AI SQL Generation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <GenerateSql
                aiGeneratedSql={aiGeneratedSql}
                triggerRefreshThreads={triggerRefreshThreads}
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      </Dialog>
    </>
  );
}

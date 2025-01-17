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
import { useContext, useEffect, useState } from 'react';
import { TopNavBar, Transition } from '@/components/DBT/DBTTransformType';
import { ResizableBox } from 'react-resizable';
import PreviewPane from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GenerateSql } from '@/components/DataAnalysis/chat_with_your_data/Generate_sql';
import { useForm } from 'react-hook-form';
import {
  ChatInterface,
  ChatMessage,
} from '@/components/DataAnalysis/chat_with_your_data/ChatInterface';
import { ExpandMore } from '@mui/icons-material';
import useWebSocket from 'react-use-websocket';
import { generateWebsocketUrl } from '@/helpers/websocket';
import { Thread, Threads } from '@/components/DataAnalysis/chat_with_your_data/Threads';

export default function Explore() {
  const { data: session } = useSession();
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);

  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [width, setWidth] = useState(400);
  const [width_R, setWidth_R] = useState(400);

  const [height, setheight] = useState(500);
  const [height_R, setheight_R] = useState(500);

  const onResize = (event: any, { size }: any) => {
    setWidth(size.width);
  };
  const onResize_R = (event: any, { size }: any) => {
    setWidth_R(size.width);
  };

  const { control, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      promptToGenerateSql: '',
      aiGeneratedSql: '',
      // thread_uuid: '',
      tableData: [],
      // chatMessages: [],
      // threadsList: [],
    },
  });

  const promptToGenerateSql = watch('promptToGenerateSql');
  const aiGeneratedSql = watch('aiGeneratedSql');
  // const thread_uuid = watch('thread_uuid');
  const tableData = watch('tableData');
  // const chatMessages = watch('chatMessages');
  // const threadsList = watch('threadsList');
  //**** CODE BLOCK TO CREATE A websocket connection in the parent.  */

  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const { sendJsonMessage, lastMessage } = useWebSocket(socketUrl, {
    share: true,
    onError(event) {
      console.error('Socket error:', event);
    },
  });

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const response: { data: any; message: string; status: string; type: string } = JSON.parse(
        lastMessage.data
      ); //data has thread_uuid and sql.
      console.log(response, 'response.');
      if (response.status !== 'success') {
        errorToast(response.message, [], globalContext);
        setLoading(false);
        return;
      }

      if (response.message === 'Messages fetched successfully') {
        //this is when some old thread is selected and we are fetching the old messages.
        // setValue('chatMessages', response.data.messages);
        setChatMessages(response.data.messages);
      } else if (response.message === 'Thread created successfully') {
        // this is when the user creates a new thread.
        setValue('aiGeneratedSql', response.data.sql);
        // setValue('thread_uuid', response.data.thread_uuid);

        // As soon as the thread is created we will fetch the list of all threads.
        sendJsonMessage({ action: 'get_threads' });
        // } else if (response.message === 'Response generated by bot successfully') {
        //   // this for the ongoing conversation.
        //   setValue('chatMessages', response.data.response);
      } else if (response.message === 'Threads fetched successfully') {
        // setValue('threadsList', response.data.threads); // Runs FIRST time when component renders. Renders the list of the threads created by the user.
      }
    }
  }, [lastMessage]);
  //** */

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
    //Runs when the component FIRST renders and fetches all the threads if user has created any.
    if (session) {
      sendJsonMessage({ action: 'get_threads' });
    }
  }, [session]);

  //Creates a new thread.
  const fetchDataFromSqlQuery = () => {
    sendJsonMessage({
      action: 'generate_sql_and_start_thread',
      params: {
        user_prompt: promptToGenerateSql,
      },
    });
    setValue('aiGeneratedSql', 'SELECT * from table_name');
    // setValue('thread_uuid', 'ksdfjklsjdflskdfjlsdkfj');
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
              threads={threads}
              setChatMessages={setChatMessages}
              setCurrentThread={setCurrentThread}
              currentThread={currentThread}
            />
          </ResizableBox>
          {/*  */}
          <Divider orientation="vertical" sx={{ color: 'black' }} />
          {/* Middle Preview Pane */}
          <Box sx={{ width: `calc(100% - ${width}px)` }}>
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
          {/* */}
          <Divider orientation="vertical" sx={{ color: 'black' }} />

          {/* Right Side Generate sql and the chats */}
          <ResizableBox
            axis="x"
            width={width}
            onResize={onResize}
            minConstraints={[280, Infinity]}
            maxConstraints={[550, Infinity]}
            resizeHandles={['w']}
          >
            {/* Here we will add the sql generated prompt and also the chat with your data thing. */}
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
                  control={control}
                  handleSubmit={handleSubmit}
                  onSubmit={fetchDataFromSqlQuery}
                  aiGeneratedSql={aiGeneratedSql}
                  currentThread={currentThread}
                />
              </AccordionDetails>
            </Accordion>

            <Box
              sx={{
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                background: '#F5FAFA',
                borderTop: '1px solid #CCCCCC',
                borderBottom: '1px solid #CCCCCC',
              }}
            ></Box>
            <Box>
              <PreviewPane height={height} />
            </Box>
          </ResizableBox>

          {/*  */}
        </Box>
      </Dialog>
    </>
  );
}

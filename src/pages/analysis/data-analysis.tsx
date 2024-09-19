import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';
import { LLMSummary } from '@/components/DataAnalysis/LLMSummary';
import { SqlWrite } from '@/components/DataAnalysis/SqlWrite';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { delay } from '@/utils/common';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { useContext, useState } from 'react';
import { SavedSession } from '@/components/DataAnalysis/SavedSession';
import { TopBar } from '@/components/DataAnalysis/TopBar';
import { jsonToCSV } from 'react-papaparse';
import { PageHead } from '@/components/PageHead';
export default function DataAnalysis() {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [openSavedSessionDialog, setOpenSavedSessionDialog] = useState(false);
  const [resetState, setResetState] = useState(false);

  interface ProgressResult {
    response?: Array<any>;
    session_id?: string;
  }

  interface ProgressEntry {
    message: string;
    status: 'running' | 'completed' | 'failed';
    result?: ProgressResult;
  }

  interface ProgressResponse {
    progress: ProgressEntry[];
  }
  const [
    { prompt, summary, newSessionId, ...oldSessionMetaInfo },
    setSessionMetaInfo,
  ] = useState({
    prompt: '',
    summary: '',
    newSessionId: '',
    session_status: '',
    sqlText: '',
    taskId: '',
    session_name: '',
    oldSessionId: '',
  });
  const handleCloseSavedSession = () => {
    setOpenSavedSessionDialog(false);
  };
  const handleOpenSavedSession = () => {
    setOpenSavedSessionDialog(true);
  };
  const handleNewSession = () => {
    setResetState(true);
    setSessionMetaInfo({
      prompt: '',
      summary: '',
      newSessionId: '',
      session_status: '',
      sqlText: '',
      taskId: '',
      session_name: '',
      oldSessionId: '',
    });
  };
  const handleEditSession = (info: any) => {
    setSessionMetaInfo({
      newSessionId: '',
      ...oldSessionMetaInfo,
      ...info,
    });
  };
  const downloadCSV = () => {
    const csv = jsonToCSV([
      {
        prompt,
        summary,
        newSessionId: newSessionId || null,
        session_status: oldSessionMetaInfo.session_status || null,
        sqlText: oldSessionMetaInfo.sqlText || null,
        taskId: oldSessionMetaInfo.taskId || null,
        session_name: oldSessionMetaInfo.session_name || null,
        oldSessionId: oldSessionMetaInfo.oldSessionId || null,
      },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //polling
  const pollForTaskRun = async (taskId: string) => {
    try {
      const response: ProgressResponse = await httpGet(
        session,
        'tasks/stp/' + taskId
      );
      const lastMessage: any =
        response['progress'][response['progress'].length - 1];
      if (!['completed', 'failed'].includes(lastMessage.status)) {
        await delay(3000);
        await pollForTaskRun(taskId);
      } else if (['failed'].includes(lastMessage.status)) {
        errorToast(lastMessage.message, [], globalContext);
        return;
      } else {
        successToast(lastMessage.message, [], globalContext);
        setSessionMetaInfo((prev) => {
          return {
            ...prev,
            summary: lastMessage?.result?.response[0].response,
            newSessionId: lastMessage?.result?.session_id,
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  // get llm summary
  const getLLMSummary = async ({
    sqlText,
    user_prompt,
  }: {
    sqlText: string;
    user_prompt: string;
  }) => {
    setLoading(true);
    try {
      const response: { request_uuid: string } = await httpPost(
        session,
        `warehouse/ask/`,
        {
          sql: sqlText,
          user_prompt,
        }
      );
      if (!response?.request_uuid) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }
      setSessionMetaInfo((prev) => {
        return {
          ...prev,
          sqlText,
          prompt: user_prompt,
          taskId: response.request_uuid,
        };
      });
      successToast(`Data analysis initiated successfully`, [], globalContext);
      await delay(3000);
      pollForTaskRun(response.request_uuid);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      errorToast(err.message, [], globalContext);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | LLM Analysis" />
      <Box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
        }}
      >
        <Box
          sx={{
            ...customCss,
            width: '45%',
            flexDirection: 'column',
          }}
        >
          {/* Top saved Session Option */}
          <TopBar
            handleOpenSavedSession={handleOpenSavedSession}
            handleNewSession={handleNewSession}
          />

          {/* SQL write Area */}
          <SqlWrite
            getLLMSummary={getLLMSummary}
            resetState={resetState}
            setResetState={setResetState}
            prompt={prompt}
            newSessionId={newSessionId}
            oldSessionMetaInfo={oldSessionMetaInfo}
          />
        </Box>

        {/* Final Summary */}
        <LLMSummary
          llmSummary={summary}
          downloadCSV={downloadCSV}
          newSessionId={newSessionId}
          oldSessionMetaInfo={oldSessionMetaInfo}
          handleNewSession={handleNewSession}
        />

        {/* Loader full screen */}
        {loading && (
          <>
            {/* <FullPageBackground> */}
            <Backdrop
              open={!!loading}
              sx={{
                zIndex: 1300,
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <>
                <CircularProgress sx={{ color: '#FFFFFF' }} />
                <Typography
                  sx={{ fontWeight: '600', fontSize: '20px', color: '#FFFFFF' }}
                >
                  Prepping your data output...
                </Typography>
              </>
            </Backdrop>
          </>
        )}

        {/* Saved Session Dailog */}
        {openSavedSessionDialog && (
          <SavedSession
            open={openSavedSessionDialog}
            onClose={handleCloseSavedSession}
            handleEditSession={handleEditSession}
          />
        )}
      </Box>
    </>
  );
}

const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
  //   borderColor: '#FFFFFF',
};

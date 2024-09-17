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
import { unparse, parse } from 'papaparse';
export default function DataAnalysis() {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [openSavedSessionDialog, setOpenSavedSessionDialog] = useState(false);

  const [{ prompt, summary, newSessionId }, setllmSummaryResult] = useState({
    //initail props
    prompt: '',
    summary: '',
    newSessionId: '',
  });
  const [oldSessionMetaInfo, setOldSessionMetaInfo] = useState({
    //while editing,  this contains previous session's metadata
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
    setllmSummaryResult({
      prompt: '',
      summary: '',
      newSessionId: '',
    });
    setOldSessionMetaInfo({
      session_status: '',
      sqlText: '',
      taskId: '',
      session_name: '',
      oldSessionId: '',
    });
  };
  const handleEditSession = (info: any) => {
    setOldSessionMetaInfo({
      ...oldSessionMetaInfo,
      ...info,
    });
    setllmSummaryResult({
      prompt: info.prompt,
      summary: info.summary,
      newSessionId: '',
    });
  };
  console.log(oldSessionMetaInfo, 'oldsession');
  const downloadCSV = () => {
    const csv = unparse([
      {
        newSessionId,
        summary,
        ...oldSessionMetaInfo,
      },
    ]);

    // Create a blob from the CSV string
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // Create a link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'summary.csv'); // Specify file name
    document.body.appendChild(link); // Append link to the body
    link.click(); // Trigger the click event to start download
    document.body.removeChild(link); // Remove the link after download
  };

  //polling
  const pollForTaskRun = async (taskId: string) => {
    try {
      const response: any = await httpGet(session, 'tasks/stp/' + taskId);
      const lastMessage: any =
        response['progress'][response['progress'].length - 1];
      console.log(lastMessage, 'lastmessage');
      if (!['completed', 'failed'].includes(lastMessage.status)) {
        await delay(3000);
        await pollForTaskRun(taskId);
      } else if (['failed'].includes(lastMessage.status)) {
        errorToast(lastMessage.message, [], globalContext);
        return;
      } else {
        successToast(lastMessage.message, [], globalContext);
        setllmSummaryResult((prev) => {
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
      const response = await httpPost(session, `warehouse/ask/`, {
        sql: sqlText,
        user_prompt,
      });
      if (response?.detail) {
        errorToast(response.detail, [], globalContext);
        return { error: 'ERROR' };
      }
      if (!response?.request_uuid) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }

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
              open={loading !== undefined ? loading : false}
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

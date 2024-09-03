import { Box, CircularProgress, Typography } from '@mui/material';

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
import { FullPageBackground } from '@/components/UI/FullScreenLoader/FullScreenLoader';

export default function DataAnalysis() {
  const { data: session } = useSession();
  const [llmSummary, setllmSummary] = useState('');
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  //polling
  const pollForTaskRun = async (taskId: string) => {
    try {
      const response: any = await httpGet(session, 'tasks/stp/' + taskId);
      const lastMessage: any =
        response['progress'][response['progress'].length - 1];

      if (!['completed', 'failed'].includes(lastMessage.status)) {
        await delay(3000);
        await pollForTaskRun(taskId);
      } else if(['failed'].includes(lastMessage.status)){
        errorToast(lastMessage.message, [], globalContext);
      } else{
        setllmSummary(lastMessage.result);
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
        session_name: `unique-${Date.now()}`,
        user_prompt,
      });
      console.log(response, 'taskid');
      if (response?.detail) {
        errorToast(response.detail, [], globalContext);
        return { error: 'ERROR' };
      }
      if (!response?.task_id) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }

      successToast(`Data analysis initiated successfully`, [], globalContext);
      await delay(3000);
      pollForTaskRun(response.task_id);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box // main box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
        }}
      >
        {/* Sql filter */}
        <SqlWrite getLLMSummary={getLLMSummary} />
        {/* LLM summary  */}
        <LLMSummary llmSummary={llmSummary} />
        {loading && (
          <>
            <FullPageBackground>
              <CircularProgress sx={{ color: '#FFFFFF' }} />
              <Typography
                sx={{ fontWeight: '600', fontSize: '20px', color: '#FFFFFF' }}
              >
                Prepping your data output...
              </Typography>
            </FullPageBackground>
          </>
        )}
      </Box>
    </>
  );
}
import { Box, Button, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import { useEffect, useState, useContext } from 'react';
import { OverWriteDialog } from './OverwriteBox';
import { useRouter } from 'next/router';
import { GlobalContext } from '@/contexts/ContextProvider';
import InfoTooltip from '../UI/Tooltip/Tooltip';
import CopyIcon from '@/assets/icons/content_copy.svg';
import DalgoIcon from '@/assets/icons/dalgoIcon.svg';
import ThumbsupIcon from '@/assets/icons/thumb_up.svg';
import ThumbsDownIcon from '@/assets/icons/thumb_up (1).svg';
import { copyToClipboard } from '@/utils/common';
import { successToast, errorToast } from '../ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const MODALS = {
  SAVE: 'SAVE',
  OVERWRITE: 'OVERWRITE',
  CONFIRM_SAVEAS: 'CONFIRM_SAVEAS',
  FEEDBACK_FORM: 'FEEDBACK_FORM',
  UNSAVED_CHANGES: 'UNSAVED_CHANGES',
  RESET_WARNING: 'RESET_WARNING',
};

export const LLMSummary = ({
  resetState,
  llmSummary,
  downloadCSV,
  newSessionId,
  oldSessionMetaInfo,
  handleNewSession,
}: {
  resetState: boolean;
  llmSummary: string;
  downloadCSV: () => void;
  newSessionId: string;
  oldSessionMetaInfo: any;
  handleNewSession: any;
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [modalName, setModalName] = useState(MODALS.SAVE);
  const [attemptedRoute, setAttemptedRoute] = useState(null);
  const globalContext = useContext(GlobalContext);
  const { dispatch, state } = globalContext?.UnsavedChanges ?? {};

  //handling save session->
  const handleSaveSession = async (
    overwrite: boolean,
    old_session_id: string | null,
    session_name: string
  ) => {
    try {
      const response: { success: number } = await httpPost(
        session,
        `warehouse/ask/${newSessionId}/save`,
        {
          session_name,
          overwrite,
          old_session_id,
        }
      );
      if (response.success) {
        successToast(`${session_name} saved successfully`, [], globalContext);
        handleNewSession(true);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  const handleFeedback = async (session_id: string, feedback: string) => {
    try {
      const response: { success: number } = await httpPost(
        session,
        `warehouse/ask/${session_id}/feedback`,
        {
          feedback,
        }
      );
      if (response.success) {
        successToast(`Feedback sent successfully`, [], globalContext);
        handleNewSession(true);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  // submitting the session name ->
  const onSubmit = (sessionName: string, overwrite: boolean) => {
    const oldSessionIdToSend = overwrite
      ? oldSessionMetaInfo?.oldSessionId
      : null;
    handleSaveSession(overwrite, oldSessionIdToSend, sessionName);
  };

  const submitFeedback = (feedback: string) => {
    let sessionIdToSend;
    if (newSessionId) {
      // if we have a newsession or if we have oldsession but again create a new summary (both oldsessionid and newsessionid).
      sessionIdToSend = newSessionId;
    } else if (oldSessionMetaInfo.oldSessionId) {
      //during edit when we have a oldsession id.
      sessionIdToSend = oldSessionMetaInfo.oldSessionId;
    }
    handleFeedback(sessionIdToSend, feedback);
  };
  // Function to handle copying text ->
  const handleCopyClick = async () => {
    const copyRes: boolean = await copyToClipboard(llmSummary);
    if (copyRes) {
      successToast('Successfully copied to clipboard', [], globalContext);
    } else {
      errorToast(
        'Some problem with copying. Please try again',
        [],
        globalContext
      );
    }
  };

  // checks for the route change->
  //cover both cases, while editing, and the first time too wehn the user creats a analysis.
  useEffect(() => {
    const handleRouteChange = (url: any) => {
      if (
        (oldSessionMetaInfo.oldSessionId && newSessionId && state === false) ||
        (newSessionId && !oldSessionMetaInfo.oldSessionId && state === false)
      ) {
        router.events.emit('routeChangeError');
        setModalName(MODALS.UNSAVED_CHANGES);
        setIsBoxOpen(true);
        dispatch({ type: 'SET_UNSAVED_CHANGES' });
        setAttemptedRoute(url);
        throw 'Unsaved changes, route change aborted';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      dispatch({ type: 'CLEAR_UNSAVED_CHANGES' });
    };
  }, [router, oldSessionMetaInfo.oldSessionId, state, newSessionId]);

  //the unsaved modal function->
  const onConfirmNavigation = () => {
    if (attemptedRoute) {
      dispatch({ type: 'SET_UNSAVED_CHANGES' });
      router.push(attemptedRoute);
    }
  };

  useEffect(() => {
    if (resetState && newSessionId) {
      setModalName(MODALS.RESET_WARNING);
      setIsBoxOpen(true);
    }
  }, [resetState]);
  // Function to handle CSV download

  return (
    <Box sx={{ ...customCss, width: '58%' }}>
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#0F2440',
            fontWeight: 600,
            fontSize: '20px',
          }}
        >
          AI Analysis
          <InfoTooltip
            title={
              <Typography variant="body2">
                The AI response based on the parameters you have provided for
                analytics. Edit the parameters to fine-tune the response
              </Typography>
            }
          />
        </Box>

        {/* Summary UI */}
        <Box
          sx={{
            height: '32rem',
            border: '2px solid #F5F5F5',
            borderRadius: '6px',
            marginTop: '2rem',
            position: 'relative',
            backgroundColor: '#F4F9F9',
          }}
        >
          <Image
            style={{
              width: '2.5rem',
              height: '2.5rem',
              position: 'relative',
              top: '2rem',
              left: '2rem',
            }}
            src={DalgoIcon}
            alt="dalgo icon"
          />
          <Typography
            sx={{
              margin: '1.75rem 2rem',
              height: '72%',
              overflowY: 'scroll', // Enable horizontal scrolling
              padding: '0 .5rem',
            }}
          >
            <Markdown remarkPlugins={[remarkGfm]}>{llmSummary}</Markdown>

            {/* {llmSummary} */}
          </Typography>

          {/* Icons */}
          <Box
            sx={{
              display: 'flex',
              gap: '0.87rem',
              position: 'absolute',
              bottom: '22px',
              right: '1.25rem',
            }}
          >
            <IconButton disabled={!llmSummary} onClick={handleCopyClick}>
              <Image
                style={{ width: '1.063rem', height: '1.25rem' }}
                src={CopyIcon}
                alt="copy icon"
              />
            </IconButton>

            <IconButton disabled={!llmSummary}>
              <Image
                style={{ width: '1.25rem', height: '1rem' }}
                src={ThumbsupIcon}
                alt="thumbs up icon"
              />
            </IconButton>

            <IconButton
              onClick={() => {
                setModalName(MODALS.FEEDBACK_FORM);
                setIsBoxOpen(true);
              }}
              disabled={!llmSummary}
            >
              <Image
                style={{ width: '1.25rem', height: '1rem' }}
                src={ThumbsDownIcon}
                alt="thumbs down icon"
              />
            </IconButton>
          </Box>
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
          <Button
            variant="outlined"
            disabled={!newSessionId}
            onClick={() => {
              setModalName(
                oldSessionMetaInfo.oldSessionId ? MODALS.OVERWRITE : MODALS.SAVE
              );
              setIsBoxOpen(true);
            }}
            sx={{
              width: '6.75rem',
              padding: '8px 0',
              borderRadius: '6px',
            }}
          >
            Save as
          </Button>
          <Button
            variant="contained"
            sx={{ width: '6.75rem', padding: '8px 0', borderRadius: '6px' }}
            disabled={!llmSummary}
            onClick={downloadCSV}
          >
            Download
          </Button>
        </Box>

        {/* Modal */}
        {isBoxOpen && (
          <OverWriteDialog
            open={isBoxOpen}
            setIsBoxOpen={setIsBoxOpen}
            modalName={modalName}
            onSubmit={onSubmit}
            submitFeedback={submitFeedback}
            onConfirmNavigation={onConfirmNavigation}
            handleNewSession={handleNewSession}
            setModalName={setModalName}
            oldSessionName={oldSessionMetaInfo.session_name}
          />
        )}
      </Box>
    </Box>
  );
};

// CSS for the container box
const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
};

LLMSummary.displayName = 'LLM-summary';

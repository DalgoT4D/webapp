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

export const LLMSummary = ({
  llmSummary,
  newSessionId,
  prompt,
  oldSessionMetaInfo,
  handleNewSession,
}: {
  llmSummary: string;
  newSessionId: string;
  prompt: string;
  oldSessionMetaInfo: any;
  handleNewSession: any;
}) => {
  const router = useRouter();
  const {data:session} = useSession();
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [modalName, setModalName] = useState('SAVE');
  const [isSessionSaved, setIsSessionSaved] = useState(false);
  const globalContext = useContext(GlobalContext);


  const handleSaveSession = async (
    overwrite: boolean,
    old_session_id: string | null,
    session_name: string
  ) => {
    try {
      const response = await httpPost(
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
        setIsSessionSaved(true);
        handleNewSession();
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  const onSubmit = (data:any, overwrite:boolean) => {
    console.log(data, overwrite, "data")
    const oldSessionIdToSend = overwrite ? oldSessionMetaInfo?.oldSessionId : null;
    handleSaveSession(overwrite, oldSessionIdToSend, data.sessionName);
  };

  // Function to handle copying text
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
          LLM Summary
          <InfoTooltip title="LLM Summary Info" />
        </Box>

        {/* Summary UI */}
        <Box
          sx={{
            height: '32rem',
            border: '2px solid #F5F5F5',
            borderRadius: '6px',
            marginTop: '2rem',
            position: 'relative',
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
              height: '80%',
              overflowY: 'scroll',
              padding: '0 .5rem',
            }}
          >
            {llmSummary}
          </Typography>

          {/* Icons */}
          <Box
            sx={{
              display: 'flex',
              gap: '0.87rem',
              position: 'absolute',
              bottom: '1.5rem',
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
                setModalName('FEEDBACK_FORM');
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
                oldSessionMetaInfo.oldSessionId ? 'OVERWRITE' : 'SAVE'
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
            disabled={!newSessionId}
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
export default LLMSummary;

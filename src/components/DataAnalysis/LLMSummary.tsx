import { Box, Button, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import InfoIcon from '@/assets/icons/info.svg';
import DalgoIcon from '@/assets/icons/dalgoIcon.svg';
import CopyIcon from '@/assets/icons/content_copy.svg';
import ThumbsupIcon from '@/assets/icons/thumb_up.svg';
import ThumbsDownIcon from '@/assets/icons/thumb_up (1).svg';
import { memo, useContext, useState } from 'react';
import { OverWriteDialog } from './OverwriteBox';
import { successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

export const LLMSummary = memo(
  ({
    llmSummary,
    newSessionId,
    prompt,
    oldSessionMetaInfo,
  }: {
    llmSummary: string;
    newSessionId: string;
    prompt: string;
    oldSessionMetaInfo: any;
  }) => {
    const [isBoxOpen, setIsBoxOpen] = useState(false);
    const [modalName, setModalName] = useState('SAVE');
    const globalContext = useContext(GlobalContext);
    const handleCopyClick = () => {
      navigator.clipboard
        .writeText(llmSummary)
        .then(() => {
          successToast('Summary copied to clipboard', [], globalContext);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    };
    console.log(modalName, 'modalname');
    return (
      <>
        <Box sx={{ ...customCss, width: '58%' }}>
          {/* inside the bottom box we will keep everything */}
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
              <Image
                style={{ width: '1rem', height: '1rem' }}
                src={InfoIcon}
                alt="info icon"
              />
            </Box>
            {/* THIS IS THE SUMMARY UI PORTION */}
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
                alt="logout icon"
              />
              <Typography
                sx={{
                  margin: '1.75rem 2rem',
                  height: '80%',
                  overflowY: 'scroll',
                  padding: '0 .5rem',
                }}
              >
                {' '}
                {llmSummary}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: '0.87rem',
                  position: 'absolute',
                  bottom: '1.5rem',
                  right: '1.25rem',
                }}
              >
                {/* Copy Icon Button */}
                <IconButton disabled={!llmSummary} onClick={handleCopyClick}>
                  <Image
                    style={{
                      width: '1.063rem',
                      height: '1.25rem',
                    }}
                    src={CopyIcon}
                    alt="copy icon"
                  />
                </IconButton>

                {/* Thumbs Up Icon Button */}
                <IconButton disabled={!llmSummary}>
                  <Image
                    style={{
                      width: '1.25rem',
                      height: '1rem',
                    }}
                    src={ThumbsupIcon}
                    alt="thumbs up icon"
                  />
                </IconButton>

                {/* Thumbs Down Icon Button with onClick */}
                <IconButton
                  onClick={() => {
                    setModalName('FEEDBACK_FORM');
                    setIsBoxOpen(true);
                  }}
                  disabled={!llmSummary}
                >
                  <Image
                    style={{
                      width: '1.25rem',
                      height: '1rem',
                    }}
                    src={ThumbsDownIcon}
                    alt="thumbs down icon"
                  />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
              <Button
                variant="contained"
                disabled={newSessionId ? false : true}
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
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #626262',
                  color: '#626262',
                  '&:hover': {
                    color: '#FFFFFF',
                  },
                }}
              >
                Save as
              </Button>
              <Button
                variant="contained"
                sx={{ width: '6.75rem', padding: '8px 0', borderRadius: '6px' }}
                disabled={newSessionId ? false : true}
              >
                Download
              </Button>
            </Box>
          </Box>
          {isBoxOpen && (
            <OverWriteDialog
              open={isBoxOpen}
              setIsBoxOpen={setIsBoxOpen}
              modalName={modalName}
              oldSessionId={oldSessionMetaInfo.oldSessionId}
              newSessionId={newSessionId}
            />
          )}
        </Box>
      </>
    );
  }
);

const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
  //   borderColor: '#FFFFFF',
};

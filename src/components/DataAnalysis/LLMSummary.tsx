import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import InfoIcon from '@/assets/icons/info.svg';
import DalgoIcon from '@/assets/icons/dalgoIcon.svg';
import CopyIcon from '@/assets/icons/content_copy.svg';
import ThumbsupIcon from '@/assets/icons/thumb_up.svg';
import ThumbsDownIcon from '@/assets/icons/thumb_up (1).svg';
import { memo, useState } from 'react';
import { OverWriteDialog } from './OverwriteBox';

export const LLMSummary = memo(({ llmSummary, newSessionId, prompt, oldSessionMetaInfo }: { llmSummary: string, newSessionId: string, prompt: string, oldSessionMetaInfo: any }) => {
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const sessionName = `${prompt}_${Date.now()}`;
  const modalName = oldSessionMetaInfo.oldSessionId ? "OVERWRITE" : "SAVE"
  console.log("hello")
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
            <Typography sx={{ margin: "1.75rem 2rem", height: "80%", overflowY: "scroll", padding: '0 .5rem' }}> {llmSummary}</Typography>
            <Box
              sx={{
                display: 'flex',
                gap: '0.87rem',
                position: 'absolute',
                bottom: '1.5rem',
                right: '1.25rem',
              }}
            >
              <Image
                style={{
                  width: '1.063rem',
                  height: '1.25rem',
                }}
                src={CopyIcon}
                alt="logout icon"
              />
              <Image
                style={{
                  width: '1.25rem',
                  height: '1rem',
                }}
                src={ThumbsupIcon}
                alt="logout icon"
              />
              <Image
                style={{
                  width: '1.25rem',
                  height: '1rem',
                }}
                src={ThumbsDownIcon}
                alt="logout icon"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
            <Button
              variant="contained"
              disabled={newSessionId ? false : true}
              onClick={() => { setIsBoxOpen(true) }}
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
          <OverWriteDialog open={isBoxOpen} setIsBoxOpen={setIsBoxOpen} session_name={sessionName} modalName={modalName} oldSessionId={oldSessionMetaInfo.oldSessionId} newSessionId={newSessionId} />
        )}
      </Box>
    </>
  );
});

const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
  //   borderColor: '#FFFFFF',
};

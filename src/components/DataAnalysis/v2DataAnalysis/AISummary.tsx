import DalgoIcon from '@/assets/icons/dalgoIcon.svg';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import { ContentCopy, ThumbDownAltOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const AISummary = ({ summary }: { summary: string }) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: '#0F2440',
          fontWeight: 600,
          fontSize: '20px',
          gap: '.2rem',
        }}
      >
        AI Analysis
        <InfoTooltip
          title={
            <Typography variant="body2">
              The AI response based on the parameters you have provided for analytics. Edit the
              parameters to fine-tune the response
            </Typography>
          }
        />
      </Box>
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
          <Markdown remarkPlugins={[remarkGfm]}>{summary}</Markdown>

          {/* {summary} */}
        </Typography>

        {/* Icons */}
        <Box
          sx={{
            display: 'flex',
            gap: '0.3rem',
            position: 'absolute',
            bottom: '22px',
            right: '1.25rem',
          }}
        >
          <IconButton
            disabled={!summary}
            // onClick={handleCopyClick}
          >
            <ContentCopy sx={{ color: summary && '#0F2440AD' }} />
          </IconButton>
          <IconButton
            // onClick={() => {
            //     trackAmplitudeEvent(`[Dislike-summary] Button Clicked`);
            //     setModalName(MODALS.FEEDBACK_FORM);
            //     setIsBoxOpen(true);
            // }}
            disabled={!summary}
          >
            <ThumbDownAltOutlined sx={{ color: summary && '#0F2440AD' }} />
          </IconButton>
        </Box>
      </Box>
    </>
  );
};

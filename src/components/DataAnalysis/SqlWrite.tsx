import {
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import SavedIcon from '@/assets/icons/folder.svg';
import InfoIcon from '@/assets/icons/info.svg';
import CloseIcon from '@/assets/icons/close_small.svg';
import { useContext, useState } from 'react';
import { SavedSession } from './SavedSession';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '../ToastMessage/ToastHelper';


const Areas_Of_Development = 'Areas of Development';
const Brightspots = 'Brightspots';
const Summarize = 'Summarize';

export const SqlWrite = ({ getLLMSummary }: { getLLMSummary: any }) => {
  const [customPromptToggle, setCustomPromptToggle] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [sqlText, setSqlText] = useState('');
  const [openSavedSessionDialog, setOpenSavedSessionDialog] = useState(false);
  const globalContext = useContext(GlobalContext);
  const handleCloseSavedSession = () => {
    setOpenSavedSessionDialog(false);
  };

  const handlePromptSelection = (promptText: string) => {
    if (customPromptToggle) {
      setCustomPrompt('');
      setCustomPromptToggle(false);
    }
    setDefaultPrompt(promptText);
  };

  const handleSubmit = async () => {
    if (!sqlText) {
      errorToast('Please enter a SELECT sql query', [], globalContext);
      return;
    }
    if (!customPrompt && !defaultPrompt) {
      errorToast(
        'Either select a default prompt or write a custom prompt',
        [],
        globalContext
      );
      return;
    }
    getLLMSummary({
      sqlText,
      user_prompt: customPrompt || defaultPrompt,
    });
  };
  return (
    <>
      <Box // two common boxes
        sx={{
          ...customCss,
          width: '42%',
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: '0.2rem',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#0F2440',
                fontWeight: 600,
                fontSize: '20px',
              }}
            >
              Parameters
              <Image
                style={{ width: '1rem', height: '1rem' }}
                src={InfoIcon}
                alt="logout icon"
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <Button
                sx={{
                  display: 'flex',
                  borderRadius: '4px',
                  backgroundColor: '#EEEEEE',
                  fontWeight: 700,
                  fontSize: '14px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1,
                  height: '2rem',
                }}
                onClick={() => {
                  setOpenSavedSessionDialog(true);
                }}
              >
                <Image
                  style={{ marginRight: 8 }}
                  src={SavedIcon}
                  alt="logout icon"
                />
                Saved Sessions
              </Button>
              <Box sx={{ flexGrow: 1 }}>
                <Button
                  variant="contained"
                  id="create-new-button"
                  sx={{ width: '100%', height: '2rem' }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
                    + New
                  </Typography>
                </Button>
              </Box>
            </Box>
          </Box>
          {/* second box */}
          <Box sx={{ width: '100%', padding: '1.25rem 0' }}>
            <hr></hr>
          </Box>
          {/* Third box with sql editor */}

          <Box sx={{ width: '100%', marginTop: '1.5rem 0' }}>
            <Typography
              sx={{ color: '#758397', fontWeight: '600', fontSize: '14px' }}
            >
              SQL Filter*
            </Typography>

            {/* This contains the sql filter */}
            <TextField
              id="outlined-multiline-static"
              sx={{ backgroundColor: 'transparent', height: '11rem' }}
              fullWidth
              multiline
              rows={6}
              value={sqlText}
              onChange={(e) => {
                setSqlText(e.target.value);
              }}
            />
          </Box>

          {/* foruth box with some buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                marginTop: '1.5rem',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#758397',
                  }}
                >
                  Select a prompt*
                </Typography>
                <Typography
                  sx={{
                    fontWeight: '500',
                    fontSize: '12px',
                    color: '#758397',
                  }}
                >
                  (Choose any one from the given prompts)
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                flexWrap: 'wrap',
                height: '2.75rem',
              }}
            >
              <Button
                variant="contained"
                id="create-new-button"
                sx={{
                  flex: '1 1 auto',
                  backgroundColor:
                    defaultPrompt === 'Brightspots' ? '#05443e' : '#00897B',
                }}
                onClick={() => {
                  handlePromptSelection(Brightspots);
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                  {Brightspots}
                </Typography>
              </Button>
              <Button
                variant="contained"
                id="create-new-button"
                sx={{
                  flex: '1 1 auto',
                  backgroundColor:
                    defaultPrompt === Areas_Of_Development
                      ? '#05443e'
                      : '#00897B',
                }}
                onClick={() => {
                  handlePromptSelection(Areas_Of_Development);
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                  {Areas_Of_Development}
                </Typography>
              </Button>
              <Button
                variant="contained"
                id="create-new-button"
                sx={{
                  flex: '1 1 auto',

                  backgroundColor:
                    defaultPrompt === Summarize ? '#05443e' : '#00897B',
                }}
                onClick={() => {
                  handlePromptSelection(Summarize);
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                  {Summarize}
                </Typography>
              </Button>
            </Box>

            <Typography
              sx={{ fontWeight: 600, fontSize: '16px', color: '#3C4C63' }}
            >
              OR
            </Typography>

            {customPromptToggle ? (
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography>Custom Prompt</Typography>
                  <Image
                    src={CloseIcon}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCustomPromptToggle(false);
                      setCustomPrompt('');
                    }}
                    alt="close icon"
                  />
                </Box>
                <TextField
                  name="custom-prompt"
                  key="custom-prompt"
                  data-testid="search-stream"
                  multiline
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                  }}
                />
              </Box>
            ) : (
              <Button
                variant="contained"
                sx={{ width: '100%', height: '2.75rem', borderRadius: '6px' }}
                onClick={() => {
                  if (defaultPrompt) {
                    setDefaultPrompt('');
                  }
                  setCustomPromptToggle(true);
                }}
              >
                + Add a custom prompt
              </Button>
            )}
          </Box>
          <Button
            onClick={() => {
              handleSubmit();
            }}
            variant="contained"
            sx={{
              width: '6.75rem',
              marginTop: '6rem',
              padding: '8px 0',
              borderRadius: '5px',
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>

      <SavedSession
        open={openSavedSessionDialog}
        onClose={handleCloseSavedSession}
      /> 
    </>
  );
};

const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
  //   borderColor: '#FFFFFF',
};

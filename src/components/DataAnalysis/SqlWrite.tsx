import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import Image from 'next/image';

import CloseIcon from '@/assets/icons/close_small.svg';
import { memo, useContext, useEffect, useState } from 'react';

import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '../ToastMessage/ToastHelper';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';

export const SqlWrite = memo(
  ({
    getLLMSummary,
    prompt,
    newSessionId,
    oldSessionMetaInfo,
  }: {
    getLLMSummary: any;
    prompt: string;
    oldSessionMetaInfo: any;
    newSessionId: string;
  }) => {
    const { data: session } = useSession();
    const [defaultPromptsLists, setDefaultPromptLists] = useState([]);
    const [customPromptToggle, setCustomPromptToggle] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [defaultPrompt, setDefaultPrompt] = useState('');
    const [sqlText, setSqlText] = useState('');
    const globalContext = useContext(GlobalContext);
    const [tempLoading, setTempLoading] = useState(false);

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

    useEffect(() => {
      try {
        setTempLoading(true);
        const getDefaultPrompts = async () => {
          const response = await httpGet(session, `data/user_prompts/`);
          if (!response.length) {
            errorToast('No Custom Prompts found', [], globalContext);
            return;
          }
          setDefaultPromptLists(response);
        };

        if (session) {
          getDefaultPrompts();
        }
      } catch (error: any) {
        console.log(error);
        errorToast(error.message, [], globalContext);
      } finally {
        setTempLoading(false);
      }
    }, [session]);

    useEffect(() => {
      const isDefaultPrompt = defaultPromptsLists.some((item: any) => {
        return item?.prompt === prompt;
      });
      setCustomPromptToggle(
        isDefaultPrompt || !oldSessionMetaInfo.sqlText ? false : true
      );
      setCustomPrompt(isDefaultPrompt ? '' : prompt);
      setDefaultPrompt(isDefaultPrompt ? prompt : '');
      setSqlText(oldSessionMetaInfo?.sqlText || '');
    }, [defaultPromptsLists, oldSessionMetaInfo]);

    if (tempLoading) return <CircularProgress />;
    return (
      <>
        <Box
          sx={{ width: '100%' }}
          key={defaultPromptsLists.length ? 'goodkey' : 'badkey'}
        >
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
              {defaultPromptsLists.map((defaultPrompts: any) => {
                return (
                  <Button
                    key={defaultPrompts.id}
                    variant="contained"
                    id="create-new-button"
                    sx={{
                      flex: '1 1 auto',
                      backgroundColor:
                        defaultPrompt === defaultPrompts.prompt
                          ? '#05443e'
                          : '#00897B',
                    }}
                    onClick={() => {
                      handlePromptSelection(defaultPrompts.prompt);
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                      {defaultPrompts.label}
                    </Typography>
                  </Button>
                );
              })}
            </Box>

            <Typography
              sx={{ fontWeight: 600, fontSize: '16px', color: '#3C4C63' }}
            >
              OR
            </Typography>

            <Box sx={{ width: '100%', minHeight: '8rem' }}>
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
          </Box>
          <Button
            onClick={() => {
              handleSubmit();
            }}
            disabled={newSessionId ? true : false}
            variant="contained"
            sx={{
              width: '6.75rem',
              marginTop: '2.5rem',
              padding: '8px 0',
              borderRadius: '5px',
            }}
          >
            Submit
          </Button>
        </Box>
      </>
    );
  }
);

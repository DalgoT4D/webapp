import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { memo, useContext, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
    const globalContext = useContext(GlobalContext);
    const [tempLoading, setTempLoading] = useState(false);

    const {
      control,
      setValue,
      watch,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm({
      defaultValues: {
        defaultPrompt: '',
        customPrompt: '',
        sqlText: '',
      },
    });

    const selectedDefaultPrompt = watch('defaultPrompt');
    const customPromptValue = watch('customPrompt');

    const handlePromptSelection = (promptText: string) => {
      setCustomPromptToggle(false);
      setValue('defaultPrompt', promptText);
      setValue('customPrompt', '');
    };

    const onSubmit = (data: any) => {
      const { sqlText, customPrompt, defaultPrompt } = data;
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
      const getDefaultPrompts = async () => {
        try {
          setTempLoading(true);
          const response = await httpGet(session, `data/user_prompts/`);
          if (!response.length) {
            errorToast('No Custom Prompts found', [], globalContext);
            return;
          }
          setDefaultPromptLists(response);
        } catch (error: any) {
          errorToast(error.message, [], globalContext);
        } finally {
          setTempLoading(false);
        }
      };

      if (session) {
        getDefaultPrompts();
      }
    }, [session]);

    useEffect(() => {
      const isDefaultPrompt = defaultPromptsLists.some((item: any) => {
        return item?.prompt === prompt;
      });
      setCustomPromptToggle(
        isDefaultPrompt || !oldSessionMetaInfo.sqlText ? false : true
      );
      reset({
        defaultPrompt: isDefaultPrompt ? prompt : '',
        customPrompt: isDefaultPrompt ? '' : prompt,
        sqlText: oldSessionMetaInfo?.sqlText || '',
      });
    }, [defaultPromptsLists, oldSessionMetaInfo]);

    if (tempLoading) return <CircularProgress />;

    return (
      <>
        <Box
          sx={{ width: '100%' }}
          key={defaultPromptsLists.length ? 'goodkey' : 'badkey'}
        >
          {/* Second box */}
          <Box sx={{ width: '100%', padding: '1.25rem 0' }}>
            <hr></hr>
          </Box>

          {/* SQL Editor */}
          <Box sx={{ width: '100%', marginTop: '1.5rem 0' }}>
            <Typography
              sx={{ color: '#758397', fontWeight: '600', fontSize: '14px' }}
            >
              SQL Filter*
            </Typography>

            <Controller
              name="sqlText"
              control={control}
              rules={{ required: 'SQL query is required' }}
              render={({ field }) => (
                <TextField
                  id="outlined-multiline-static"
                  sx={{ backgroundColor: 'transparent', height: '11rem' }}
                  fullWidth
                  multiline
                  rows={6}
                  {...field}
                  error={!!errors.sqlText}
                  helperText={errors.sqlText?.message}
                />
              )}
            />
          </Box>

          {/* Prompt Selection */}
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
              {defaultPromptsLists.map((defaultPrompts: any) => (
                <Button
                  key={defaultPrompts.id}
                  variant="contained"
                  id="create-new-button"
                  sx={{
                    flex: '1 1 auto',
                    backgroundColor:
                      selectedDefaultPrompt === defaultPrompts.prompt
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
              ))}
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
                    <CloseIcon
                      onClick={() => {
                        setCustomPromptToggle(false);
                        setValue('customPrompt', '');
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>

                  <Controller
                    name="customPrompt"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        multiline
                        rows={2}
                        {...field}
                        error={!!errors.customPrompt && !selectedDefaultPrompt}
                        helperText={
                          errors.customPrompt && !selectedDefaultPrompt
                            ? 'Custom prompt is required if no default is selected'
                            : ''
                        }
                      />
                    )}
                  />
                </Box>
              ) : (
                <Button
                  variant="contained"
                  sx={{
                    width: '100%',
                    height: '2.75rem',
                    borderRadius: '6px',
                  }}
                  onClick={() => {
                    setValue('defaultPrompt', '');
                    setCustomPromptToggle(true);
                  }}
                >
                  + Add a custom prompt
                </Button>
              )}
            </Box>
          </Box>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!!newSessionId}
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


SqlWrite.displayName  = "Sql-write";
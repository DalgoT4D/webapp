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
import InfoTooltip from '../UI/Tooltip/Tooltip';
interface Prompt {
  id: string;
  label: string;
  prompt: string;
}

type PromptsResult = Prompt[];
type LimitResult = number;
export const SqlWrite = memo(
  ({
    getLLMSummary,
    prompt,
    setResetState,
    resetState,
    newSessionId,
    oldSessionMetaInfo,
  }: {
    getLLMSummary: any;
    setResetState: (x: boolean) => void;
    resetState: boolean;
    prompt: string;
    oldSessionMetaInfo: any;
    newSessionId: string;
  }) => {
    const { data: session } = useSession();
    const [defaultPromptsLists, setDefaultPromptLists] = useState<Prompt[]>([]);
    const [customPromptToggle, setCustomPromptToggle] = useState(false);
    const globalContext = useContext(GlobalContext);
    const [tempLoading, setTempLoading] = useState(false);
    const [sqlQueryLimit, setSqlQueryLimit] = useState<number>(500); //deafult value

    const {
      control,
      setValue,
      watch,
      handleSubmit,
      // formState: { errors },
      reset,
    } = useForm({
      defaultValues: {
        defaultPrompt: '',
        customPrompt: '',
        sqlText: '',
      },
    });

    const selectedDefaultPrompt = watch('defaultPrompt');

    const handlePromptSelection = (promptText: string) => {
      setCustomPromptToggle(false);
      setValue('defaultPrompt', promptText);
      setValue('customPrompt', '');
    };

    const onSubmit = (data: any) => {
      const { sqlText, customPrompt, defaultPrompt } = data;
      console.log(sqlText, 'sqltest');
      if (!sqlText && !customPrompt && !defaultPrompt) {
        errorToast(
          'Please provide a SQL query and select either a default or custom prompt.',
          [],
          globalContext
        );
        return;
      }

      if (!sqlText) {
        errorToast(
          'Please provide a SQL query to query the data.',
          [],
          globalContext
        );
        return;
      }

      if (!customPrompt && !defaultPrompt) {
        errorToast(
          'Please either select a default prompt or enter a custom prompt.',
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

    //get deafult prompts initially
    useEffect(() => {
      const getDefaultPrompts = async () => {
        try {
          setTempLoading(true);
          const [promptsResult, limitResult]: [
            PromiseSettledResult<PromptsResult>,
            PromiseSettledResult<LimitResult>
          ] = await Promise.allSettled([
            httpGet(session, 'data/user_prompts/'),
            httpGet(session, 'data/llm_data_analysis_query_limit/'),
          ]);

          if (
            promptsResult.status === 'fulfilled' &&
            promptsResult.value.length
          ) {
            setDefaultPromptLists(promptsResult.value);
          } else {
            errorToast(
              'No Custom Prompts found or failed to fetch prompts',
              [],
              globalContext
            );
          }
          if (limitResult.status === 'fulfilled' && limitResult.value) {
            setSqlQueryLimit(limitResult.value);
          } else {
            errorToast('Failed to fetch SQL query limit', [], globalContext);
          }
        } catch (error: any) {
          console.error('Error fetching data:', error);
          errorToast(
            error.message || 'An unexpected error occurred',
            [],
            globalContext
          );
        } finally {
          setTempLoading(false);
        }
      };

      if (session) {
        getDefaultPrompts();
      }
    }, [session]);

    //works while editing
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
    }, [defaultPromptsLists, oldSessionMetaInfo.sqlText]);

    //resets the state when clicked new button.
    useEffect(() => {
      //if resetState is true and there is session_name, which means the session is already saved.
      // session_name - 1sst time works, 2nd tiem, we have session_name
      const savedSessionResetCase =
        oldSessionMetaInfo.session_name && !newSessionId;
      if (resetState && savedSessionResetCase) {
        reset({
          defaultPrompt: '',
          customPrompt: '',
          sqlText: '',
        });
      }
      setResetState(false);
    }, [resetState]);
    console.log(resetState, 'resetstate');
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
            <Box display="flex" justifyContent="space-between">
              <Typography
                data-testid="sql-filter"
                sx={{ color: '#758397', fontWeight: '600', fontSize: '14px' }}
              >
                SQL Filter*
              </Typography>
              <Typography
                data-testid="sql-filter"
                sx={{ color: '#758397', fontWeight: '600', fontSize: '14px' }}
              >
                {`*You can query a maximum of ${sqlQueryLimit} rows only.`}
              </Typography>
            </Box>

            <Controller
              name="sqlText"
              control={control}
              render={({ field }) => (
                <TextField
                  id="outlined-multiline-static"
                  sx={{ backgroundColor: 'transparent', height: '11rem' }}
                  placeholder={`SELECT * \nFROM table_name`}
                  fullWidth
                  multiline
                  rows={6}
                  {...field}
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
                  data-testid={`${defaultPrompts.id}-default`}
                  id="create-new-button"
                  sx={{
                    flex: '1 1 auto',
                    backgroundColor:
                      selectedDefaultPrompt === defaultPrompts.prompt
                        ? '#00897B'
                        : '#F5FAFA',
                    color:
                      selectedDefaultPrompt === defaultPrompts.prompt
                        ? '#FFFFFF'
                        : '#3C4C63',

                    '&:hover': {
                      backgroundColor: '#00897B',
                      color: '#FFFFFF',
                    },
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
                      marginBottom: '0.5rem',
                    }}
                  >
                    <Box
                      display={'flex'}
                      gap="0.5rem"
                      height="1rem"
                      alignItems="center"
                    >
                      <Typography>Custom Prompt</Typography>
                      <InfoTooltip
                        title={
                          <div>
                            <Typography variant="body2" gutterBottom>
                              Tips for Writing a Good Prompt:
                            </Typography>
                            <Typography variant="body2">
                              1. Be Clear: Clearly state what you need to avoid
                              confusion.
                            </Typography>
                            <Typography variant="body2">
                              2. Add Context: Include relevant details to guide
                              the response.
                            </Typography>
                            <Typography variant="body2">
                              3. Adjust & Refine: If the result isn&apos;t what
                              you expected, tweak your prompt.
                            </Typography>

                            <Typography variant="body2" gutterBottom>
                              Example: If your data has some rows that contain
                              people&apos;s feelings during COVID, then instead
                              of &quot;Describe people&apos;s feelings during
                              COVID,&quot; try: &quot;This data is a list of
                              responses from people about how they are feeling.
                              Analyse the data and give me the different
                              emotions that people felt during covid, and also
                              which was the frequently felt emotion? Limit it to
                              one short paragraph.&quot;
                            </Typography>
                          </div>
                        }
                      />
                    </Box>
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
                      <TextField multiline rows={2} {...field} />
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
                    color: '#3C4C63',
                    backgroundColor: '#F5FAFA',

                    '&:hover': {
                      backgroundColor: '#00897B',
                      color: '#FFFFFF',
                    },
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

SqlWrite.displayName = 'Sql-write';

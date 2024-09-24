import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
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
    const globalContext = useContext(GlobalContext);
    const [tempLoading, setTempLoading] = useState(false);
    const [sqlQueryLimit, setSqlQueryLimit] = useState<number>(500); //deafult value

    const { control, setValue, watch, handleSubmit, reset } = useForm({
      defaultValues: {
        prompt: '',
        sqlText: '',
      },
    });

    const selectedPrompt = watch('prompt');

    const handlePromptSelection = (promptText: string) => {
      setValue('prompt', promptText);
    };

    const onSubmit = (data: any) => {
      const { sqlText, prompt } = data;
      if (!sqlText && !prompt) {
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

      if (!prompt) {
        errorToast(
          'Please either select a default prompt or enter a custom prompt.',
          [],
          globalContext
        );
        return;
      }
      getLLMSummary({
        sqlText,
        user_prompt: prompt,
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
      reset({
        prompt,
        sqlText: oldSessionMetaInfo?.sqlText || '',
      });
    }, [prompt, oldSessionMetaInfo.sqlText]);

    //resets the state when clicked new button.
    useEffect(() => {
      //if resetState is true and there is session_name, which means the session is already saved.
      // session_name - 1sst time works, 2nd tiem, we have session_name
      const savedSessionResetCase =
        oldSessionMetaInfo.session_name && !newSessionId;
      if (
        (resetState && savedSessionResetCase) ||
        (resetState && !oldSessionMetaInfo.session_name && !newSessionId)
      ) {
        reset({
          prompt: '',
          sqlText: '',
        });
      }
      setResetState(false);
    }, [resetState]);
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
          <Box sx={{ width: '100%', marginTop: '1.5rem', borderRadius: '6px' }}>
            <Box
              display="flex"
              justifyContent="space-between"
              marginBottom="5px"
            >
              <Typography
                data-testid="sql-filter"
                sx={{ color: '#0F2440', fontWeight: '600', fontSize: '14px' }}
              >
                SQL Filter*
              </Typography>
              <Typography
                data-testid="sql-filter"
                sx={{ color: '#0F2440', fontWeight: '500', fontSize: '12px' }}
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
                  sx={{
                    backgroundColor: 'transparent',
                    borderRadius: '6px',
                  }}
                  placeholder={`SELECT * \nFROM table_name`}
                  fullWidth
                  multiline
                  rows={3}
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
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#0F2440',
                  }}
                >
                  Prompt*
                </Typography>
                <Typography
                  sx={{
                    fontWeight: '500',
                    fontSize: '12px',
                    color: '#0F2440',
                  }}
                >
                  Select a given prompt or add a custom prompt
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
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor:
                      selectedPrompt === defaultPrompts.prompt
                        ? '#00897B'
                        : '#F5FAFA',
                    color:
                      selectedPrompt === defaultPrompts.prompt
                        ? '#FFFFFF'
                        : '#0F2440CC',

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

            <Box sx={{ width: '100%', minHeight: '10rem', marginTop: '.5rem' }}>
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
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#0F2440',
                        fontWeight: '600',
                      }}
                    >
                      Custom Prompt
                    </Typography>
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
                            people&apos;s feelings during COVID, then instead of
                            &quot;Describe people&apos;s feelings during
                            COVID,&quot; try: &quot;This data is a list of
                            responses from people about how they are feeling.
                            Analyse the data and give me the different emotions
                            that people felt during covid, and also which was
                            the frequently felt emotion? Limit it to one short
                            paragraph.&quot;
                          </Typography>
                        </div>
                      }
                    />
                  </Box>
                </Box>

                <Controller
                  name="prompt"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      placeholder="Enter your customized prompt here"
                      multiline
                      rows={6}
                      {...field}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit(onSubmit)}
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

import { TopBar } from '@/components/DataAnalysis/TopBar';
import { PageHead } from '@/components/PageHead';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ResizableBox } from 'react-resizable';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';

import { httpGet, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { delay } from '@/utils/common';
import { ExpandMore } from '@mui/icons-material';

interface ProgressResult {
  response?: Array<any>;
  session_id?: string;
}

interface ProgressEntry {
  message: string;
  status: 'running' | 'completed' | 'failed';
  result?: ProgressResult;
}

interface ProgressResponse {
  progress: ProgressEntry[];
}
const ResizeBoxContainer = () => {
  const [lowerSectionHeight, setLowerSectionHeight] = useState(300);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  const onResize = (event: any, { size }: { size: { height: number } }) => {
    setLowerSectionHeight(size.height);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Accordion Wrapper */}
      <Accordion
        expanded={isAccordionOpen}
        onChange={() => setIsAccordionOpen(!isAccordionOpen)}
        sx={{
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backgroundColor: '#F8FAFC',
          marginBottom: '1rem',
        }}
      >
        {/* Accordion Header */}
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            backgroundColor: '#E3F2FD',
            borderBottom: '1px solid #ddd',
            borderRadius: isAccordionOpen ? '10px 10px 0 0' : '10px',
          }}
        >
          <Typography sx={{ fontWeight: 'bold' }}>Resizable SQL Preview</Typography>
        </AccordionSummary>

        {/* Accordion Content - Resizable SQL Box */}
        <AccordionDetails sx={{ padding: '0' }}>
          <ResizableBox
            axis="y"
            resizeHandles={['n']}
            width={Infinity}
            height={lowerSectionHeight}
            minConstraints={[Infinity, 100]} // Prevents shrinking too much
            maxConstraints={[Infinity, 500]} // Prevents expanding too much
            onResize={onResize}
            style={{
              overflow: 'hidden',
              width: '100%',
              transition: 'height 0.2s ease',
            }}
          >
            <Box
              sx={{
                height: '100%',
                boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Your SQL Preview Component */}
              {/* <PreviewPaneSql height={lowerSectionHeight} initialSqlString={""} /> */}
            </Box>
          </ResizableBox>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
const UpperSection = () => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  const { control, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      prompt: '',
      sqlText: `SELECT 
    customers.customer_id,
    customers.first_name,
    customers.last_name,
    orders.order_id,
    orders.order_date,
    SUM(order_items.quantity * order_items.price) AS total_spent
FROM customers
JOIN orders ON customers.customer_id = orders.customer_id
JOIN order_items ON orders.order_id = order_items.order_id
WHERE orders.order_date >= '2023-01-01'
GROUP BY customers.customer_id, orders.order_id
ORDER BY total_spent DESC;
`,
      summary: `
      Summary: This query retrieves customer details along with their total spending amount for each order. 
It joins three tables ('customers', 'orders', and "order_items") to aggregate the total cost per order 
by multiplying the "quantity" and "price" fields. The results are grouped by "customer_id" and "order_id", 
then sorted in descending order based on the total spending amount. Additionally, it filters orders placed 
from January 1, 2023, onward.

      `,
    },
  });

  const user_prompt = watch('prompt');
  const sqlText = watch('sqlText');
  const summary = watch('summary');

  const pollForTaskGetSql = async (taskId: string) => {
    try {
      const response: ProgressResponse = await httpGet(session, 'tasks/stp/' + taskId);
      const lastMessage: any =
        response['progress'] && response['progress'].length > 0
          ? response['progress'][response['progress'].length - 1]
          : null;

      if (!['completed', 'failed'].includes(lastMessage?.status)) {
        await delay(3000);
        await pollForTaskGetSql(taskId);
      } else if (lastMessage?.status === 'failed') {
        errorToast(lastMessage?.message, [], globalContext);
        return;
      } else if (lastMessage?.status === 'completed') {
        successToast(lastMessage?.message, [], globalContext);
        setValue('sqlText', lastMessage?.result?.response);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSql = async () => {
    setLoading(true);
    try {
      const response: { request_uuid: string } = await httpPost(session, `warehouse/v1/ask/`, {
        user_prompt,
      });
      if (!response?.request_uuid) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }
      await delay(3000);
      pollForTaskGetSql(response.request_uuid);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '60vh',
          boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1rem 3rem',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          {/* Top Bar */}
          <TopBar handleOpenSavedSession={() => {}} handleNewSession={() => {}} />

          {/* SQL Input Field - Should Take Up Available Space */}
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: '10px',
              padding: '1rem',
              backgroundColor: '#F8FAFC',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* Sticky Buttons on Top Right */}
            <Box
              sx={{
                position: 'sticky',
                zIndex: '1000',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                width: '100%',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  padding: '6px 12px',
                  boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                }}
                // onClick={handleSave} // Define this function
              >
                Save
              </Button>

              <Button
                variant="contained"
                color="primary"
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  padding: '6px 12px',
                  boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                }}
                // onClick={handleDownload} // Define this function
              >
                Download
              </Button>
            </Box>

            {/* Placeholder Text Before SQL Appears */}
            {!sqlText && (
              <Typography sx={{ color: '#aaa', fontSize: '14px', fontStyle: 'italic' }}>
                SQL will appear here...
              </Typography>
            )}

            {/* SQL Message Bubble */}
            {sqlText && (
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  maxWidth: '75%',
                  minWidth: '50%',
                  padding: '12px',
                  backgroundColor: '#E8F5F5',
                  borderRadius: '18px 18px 4px 18px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#444' }}>
                  SQL Generated
                </Typography>
                <Controller
                  name="sqlText"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      data-testid="sqlTest-box"
                      id="outlined-multiline-static"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        width: '100%',
                      }}
                      placeholder={`SELECT * \nFROM table_name`}
                      fullWidth
                      multiline
                      {...field}
                      InputProps={{
                        style: {
                          backgroundColor: 'transparent',
                          borderRadius: '6px',
                          padding: '12px',
                        },
                      }}
                    />
                  )}
                />
              </Box>
            )}

            {/* Summary Message Bubble - Right Side */}
            {summary && (
              <Box
                sx={{
                  alignSelf: 'flex-end',
                  maxWidth: '75%',
                  minWidth: '50%',
                  padding: '12px',
                  backgroundColor: '#FDE9D9',
                  borderRadius: '18px 4px 18px 18px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#444' }}>
                  Summary Generated
                </Typography>
                <Typography sx={{ fontSize: '16px' }}>{summary}</Typography>
              </Box>
            )}

            {/* Fixed "Summarize" Button */}
            {!summary && (
              <Button
                variant="contained"
                color="primary"
                sx={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  padding: '6px 12px',
                  boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                }}
                // onClick={handleSummarize} // Add your function here
              >
                Summarize
              </Button>
            )}
          </Box>

          {/* Prompt + Button Wrapper - Always at Bottom */}
          <Box
            sx={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              marginTop: 'auto', // Pushes this container to the bottom
            }}
          >
            {/* Prompt Input */}
            <Controller
              name="prompt"
              control={control}
              render={({ field }) => (
                <TextField
                  data-testid="prompt-box"
                  id="outlined-multiline-static"
                  sx={{
                    borderRadius: '6px',
                    flexGrow: 1,
                    '& .MuiInputBase-root': {
                      minHeight: '56px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    },
                  }}
                  placeholder="Enter a prompt"
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={6}
                  {...field}
                  InputProps={{
                    style: {
                      backgroundColor: '#E8F5F5',
                      borderRadius: '6px',
                    },
                  }}
                />
              )}
            />

            {/* Submit Button */}
            <Button
              variant="contained"
              id="create-new-button"
              sx={{
                minHeight: '52px',
                padding: '0.4rem',
                width: '8rem',
                alignSelf: 'flex-end', // Ensures alignment with input field
                backgroundColor: '#00897B',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#00695C',
                },
                '&:disabled': {
                  backgroundColor: '#E0E0E0',
                  color: '#9E9E9E',
                },
              }}
              disabled={loading}
              onClick={handleGenerateSql}
            >
              {loading ? 'Generating...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const AIDataAnalysis = () => {
  return (
    <>
      <PageHead title="Dalgo | AI Data Analysis" />
      <Box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
          flexDirection: 'column',
        }}
      >
        <UpperSection />
        <ResizeBoxContainer />
      </Box>
    </>
  );
};

export default AIDataAnalysis;

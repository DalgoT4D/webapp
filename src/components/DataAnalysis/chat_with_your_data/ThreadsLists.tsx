import { Box, Divider, Tab, Tabs, Typography } from '@mui/material';

export const ThreadsLists = ({ threadsList, sendJsonMessage, thread_uuid, setValue }: any) => {
  const fetchSingleThread = (thread: any) => {
    setValue('aiGeneratedSql', thread.sql);
    setValue('thread_uuid', thread.uuid);
    sendJsonMessage({ action: 'get_messages', thread_uuid: thread.uuid });
  };
  console.log(threadsList, 'ThreadLists');
  return (
    <>
      <Box>
        <Typography variant="h4">Threads</Typography>
        <Divider />

        {threadsList.length ? (
          <Tabs orientation="vertical" variant="scrollable">
            {threadsList.map((thread: any, index: number) => (
              <Tab
                dir="bottom"
                sx={{ border: thread_uuid === thread.uuid ? '1px solid red' : 'none' }}
                key={index}
                label={thread.name}
                onClick={() => {
                  fetchSingleThread(thread);
                }}
              />
            ))}
          </Tabs>
        ) : (
          <Typography variant="body1">No threads available</Typography>
        )}
      </Box>
    </>
  );
};

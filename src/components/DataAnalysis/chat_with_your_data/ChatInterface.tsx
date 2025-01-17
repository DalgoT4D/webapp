import { Box } from '@mui/material';
import { useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import { UserPrompts } from './UserPrompts';
import { AIBotResponse } from './AIBotResponse';
import { StickyInputBox } from './StickyInput';

import { useSession } from 'next-auth/react';

export enum ChatMessageType {
  HUMAN = 'human',
  BOT = 'ai',
}

export interface ChatMessage {
  content: string;
  created_at: string;
  type: string;
  id: number;
}

// this can be the parent component and we can fetch the chat here and then send them as props to the children.
// if its a old chat that also we can fetch and show
// if new chat that too we can fetch from here and send.
// Good this is the same parnet compmpoennt then.

export const ChatInterface = ({
  thread_uuid,
  aiGeneratedSql,
  sendJsonMessage,
  chatMessages,
}: any) => {
  const globalContext = useContext(GlobalContext);
  const { data: session }: any = useSession();
  const { control, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      userMessage: '',
    },
  });
  const userMessage = watch('userMessage');

  //chatting with the bot.
  const onSubmit = () => {
    sendJsonMessage({ message: userMessage, action: 'ask_bot', thread_uuid: thread_uuid });
    setValue('userMessage', '');
  };
  return (
    <>
      <Box>
        <Box
          sx={{
            height: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'scroll',
          }}
        >
          {/* Top box will have chats  */}
          <Box sx={{}}>
            {chatMessages.length &&
              chatMessages.map((message: ChatMessage, index: any) => {
                if (message.type === ChatMessageType.HUMAN) {
                  return <UserPrompts key={index} message={message} />;
                } else {
                  return <AIBotResponse key={index} message={message} />;
                }
              })}
          </Box>
          {/* Bottom box will have user input fixed */}
          <Box></Box>
        </Box>

        <StickyInputBox handleSubmit={handleSubmit} onSubmit={onSubmit} control={control} />
      </Box>
    </>
  );
};

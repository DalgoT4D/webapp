import React from 'react';
import { Box } from '@mui/material';

export interface CanvasMessage {
  id: string;
  content: JSX.Element;
  show: boolean;
}

interface CanvasMessagesProps {
  messages: CanvasMessage[];
}

const CanvasMessages: React.FC<CanvasMessagesProps> = ({ messages }) => {
  const visibleMessages = messages.filter((message) => message.show);

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {visibleMessages.map((message) => (
        <Box
          key={message.id}
          sx={{
            backgroundColor: '#E0F2F1',
            border: '1px solid #00897B',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '300px',
            fontSize: '12px',
            color: '#00897B',
            fontWeight: 500,
          }}
        >
          {message.content}
        </Box>
      ))}
    </Box>
  );
};

export default CanvasMessages;

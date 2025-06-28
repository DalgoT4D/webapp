import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

interface WebSocketConnectionOptions {
  maxRetries?: number;
  handleError?: (event: Event) => void;
}

export const useWebSocketConnection = (
  endpoint: string | null,
  options: WebSocketConnectionOptions = {}
) => {
  const { maxRetries = 5, handleError } = options;
  const [socketUrl, setSocketUrl] = useState<string | null>(endpoint);

  const { sendJsonMessage, lastMessage, getWebSocket } = useWebSocket(socketUrl, {
    share: false,
    shouldReconnect: () => true,
    reconnectAttempts: maxRetries,
    reconnectInterval: (attemptNumber) => Math.min(1000 * Math.pow(2, attemptNumber), 30000), // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    onError(event) {
      if (handleError) {
        handleError(event);
      } else {
        console.error('Socket error:', event);
      }
    },
  });

  // Cleanup function
  const disconnect = () => {
    setSocketUrl(null);
    const ws = getWebSocket();
    if (ws) {
      ws.close();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return { sendJsonMessage, lastMessage, setSocketUrl, disconnect };
};

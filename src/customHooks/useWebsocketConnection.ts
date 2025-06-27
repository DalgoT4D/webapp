import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

export const useWebSocketConnection = (endpoint: string | null, maxRetries: number = 5) => {
  const [socketUrl, setSocketUrl] = useState<string | null>(endpoint);

  const { sendJsonMessage, lastMessage, getWebSocket } = useWebSocket(socketUrl, {
    share: false,
    shouldReconnect: () => true,
    reconnectAttempts: maxRetries,
    reconnectInterval: (attemptNumber) => Math.min(1000 * Math.pow(2, attemptNumber), 30000), // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    onError(event) {
      console.error('Socket error:', event);
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

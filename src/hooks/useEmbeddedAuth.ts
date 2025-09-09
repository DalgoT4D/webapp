import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getEmbeddedAuth } from '@/middleware/embeddedAuth';

export function useEmbeddedAuth() {
  const router = useRouter();
  const [embeddedAuth, setEmbeddedAuth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for embedded auth from query params
    const auth = getEmbeddedAuth();

    if (auth) {
      // Create a mock session for embedded mode
      const mockSession = {
        user: {
          token: auth.token,
          email_verified: true,
        },
      };

      setEmbeddedAuth(mockSession);

      // Store in window for global access
      (window as any).__embeddedSession = mockSession;
    }

    setIsLoading(false);
  }, [router.query]);

  return {
    embeddedAuth,
    isLoading,
    isEmbedded: !!embeddedAuth,
  };
}

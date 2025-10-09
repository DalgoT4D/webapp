import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { signIn, signOut, useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// Extend the session user type to include our custom token property
interface ExtendedUser {
  token?: string;
  email?: string;
  active?: boolean;
  email_verified?: boolean;
  can_create_orgs?: boolean;
}

// Message types matching parent
interface IframeMessage {
  type: 'AUTH_UPDATE' | 'ORG_SWITCH' | 'AUTH_REQUEST' | 'READY' | 'LOGOUT';
  payload?: {
    token?: string;
    orgSlug?: string;
    timestamp?: number;
  };
  source: 'webapp_v2' | 'webapp';
}

interface ParentCommState {
  isEmbedded: boolean;
  parentToken: string | null;
  parentOrgSlug: string | null;
  hideHeader: boolean;
  isReady: boolean;
  isEmbeddingBlocked: boolean; // Track if embedding is blocked due to security
}

const ParentCommunicationContext = createContext<ParentCommState | null>(null);

export function ParentCommunicationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUser = session?.user as ExtendedUser;

  // Parse allowed parent origins from environment
  const getAllowedParentOrigins = useCallback((): string[] => {
    const allowedOriginsEnv = process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS;
    if (!allowedOriginsEnv) {
      console.warn('[ParentComm] No NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS configured');
      return [];
    }

    return allowedOriginsEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }, []);

  const [state, setState] = useState<ParentCommState>({
    isEmbedded: false,
    parentToken: null,
    parentOrgSlug: null,
    hideHeader: false,
    isReady: false,
    isEmbeddingBlocked: false,
  });

  // Check if we're in an iframe and validate the parent origin
  const checkIfEmbedded = useCallback(() => {
    if (typeof window === 'undefined') return false;

    try {
      const isEmbedded = window.self !== window.top;

      if (isEmbedded) {
        // Validate parent origin if we're embedded
        const allowedOrigins = getAllowedParentOrigins();

        if (allowedOrigins.length === 0) {
          console.error(
            '[ParentComm] SECURITY: App is embedded but no allowed parent origins configured'
          );
          setState((prev) => ({ ...prev, isEmbeddingBlocked: true }));
          return false; // Block embedding if no origins allowed
        }

        try {
          const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;

          if (parentOrigin && !allowedOrigins.includes(parentOrigin)) {
            console.error(
              '[ParentComm] SECURITY: App embedded by untrusted origin:',
              parentOrigin,
              'Allowed origins:',
              allowedOrigins
            );
            setState((prev) => ({ ...prev, isEmbeddingBlocked: true }));
            return false;
          }

          console.log('[ParentComm] Embedded by trusted origin:', parentOrigin);
        } catch (error) {
          console.warn('[ParentComm] Could not determine parent origin:', error);
        }
      }

      return isEmbedded;
    } catch (e) {
      // Cross-origin iframe will throw an error
      return true;
    }
  }, [getAllowedParentOrigins]);

  // Handle organization switch
  const handleOrgSwitch = useCallback((orgSlug: string) => {
    console.log('[ParentComm Provider] Switching to organization:', orgSlug);

    // Update sessionStorage for parent communication
    sessionStorage.setItem('parentOrgSlug', orgSlug);

    // Update state
    setState((prev) => ({
      ...prev,
      parentOrgSlug: orgSlug,
    }));

    // The Header component will detect parentOrgSlug change and handle the actual switch
    // by setting selectedOrg, which triggers the existing org switch logic
  }, []);

  // Handle authentication update from parent
  const handleAuthUpdate = useCallback(
    async (payload: { token?: string; orgSlug?: string }) => {
      const { token, orgSlug } = payload;

      if (!token || !orgSlug) {
        console.warn('[ParentComm Provider] Received incomplete auth update');
        return;
      }

      console.log('[ParentComm Provider] Handling auth update with org:', orgSlug);

      // Store in sessionStorage for HTTP helpers
      sessionStorage.setItem('parentToken', token);
      sessionStorage.setItem('parentOrgSlug', orgSlug);

      // Update state
      setState((prev) => ({
        ...prev,
        parentToken: token,
        parentOrgSlug: orgSlug,
      }));

      // If not already authenticated with this token, sign in using embed-token provider
      if (!sessionUser?.token || sessionUser.token !== token) {
        console.log(
          '[ParentComm Provider] Signing in with parent token using embed-token provider'
        );

        try {
          const result = await signIn('embed-token', {
            token,
            redirect: false, // Don't redirect automatically
          });

          if (result?.ok) {
            console.log('[ParentComm Provider] Successfully authenticated with parent token');
            // Refresh session to get updated user data
            await getSession();
          } else {
            console.error(
              '[ParentComm Provider] Failed to authenticate with parent token:',
              result?.error
            );
            return;
          }
        } catch (error) {
          console.error('[ParentComm Provider] Error during token authentication:', error);
          return;
        }
      }
    },
    [sessionUser, handleOrgSwitch]
  );

  // Handle logout from parent
  const handleLogout = useCallback(async () => {
    console.log('[ParentComm Provider] Received logout signal from parent');

    // Clear all session storage (including any other embedded auth data)
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }

    // Reset state
    setState({
      isEmbedded: true,
      parentToken: null,
      parentOrgSlug: null,
      hideHeader: true,
      isReady: false,
      isEmbeddingBlocked: false,
    });

    // Sign out from NextAuth and wait for it to complete
    await signOut({ redirect: false });

    // Redirect to login page to show proper state
    router.push('/login');
  }, [router]);

  // Send ready message to parent with secure origin validation
  const sendReadyMessage = useCallback(() => {
    if (state.isEmbedded && window.parent) {
      const allowedOrigins = getAllowedParentOrigins();

      if (allowedOrigins.length === 0) {
        console.warn(
          '[ParentComm] Cannot send READY message - no allowed parent origins configured'
        );
        return;
      }

      console.log('[ParentComm Provider] Sending READY message to parent origins:', allowedOrigins);

      const message = {
        type: 'READY',
        source: 'webapp',
      };

      // Send to each allowed parent origin instead of '*'
      allowedOrigins.forEach((origin) => {
        try {
          window.parent.postMessage(message, origin);
        } catch (error) {
          console.error('[ParentComm] Failed to send READY message to origin:', origin, error);
        }
      });

      setState((prev) => ({ ...prev, isReady: true }));
    }
  }, [state.isEmbedded, getAllowedParentOrigins]);

  // Initialize communication - THIS RUNS ONLY ONCE
  useEffect(() => {
    const isEmbedded = checkIfEmbedded();

    setState((prev) => ({
      ...prev,
      isEmbedded,
      hideHeader: isEmbedded, // Hide header when embedded
    }));

    if (!isEmbedded) {
      console.log('[ParentComm Provider] Not embedded, skipping parent communication');
      return;
    }

    console.log('[ParentComm Provider] Running in iframe, setting up parent communication');

    // Handle messages from parent - SINGLE LISTENER
    const handleMessage = async (event: MessageEvent<IframeMessage>) => {
      const allowedOrigins = getAllowedParentOrigins();

      // CRITICAL SECURITY CHECK: Validate origin against allowlist
      if (!allowedOrigins.includes(event.origin)) {
        console.warn(
          '[ParentComm] SECURITY: Blocked message from untrusted origin:',
          event.origin,
          'Allowed origins:',
          allowedOrigins
        );
        return;
      }

      // Validate message structure
      if (!event.data || typeof event.data !== 'object') {
        console.warn('[ParentComm] Invalid message data received');
        return;
      }

      // Validate message source after origin check
      if (event.data?.source !== 'webapp_v2') {
        console.warn(
          '[ParentComm] Message not from expected webapp_v2 source:',
          event.data?.source
        );
        return;
      }

      console.log(
        '[ParentComm Provider] Processing secure message from trusted parent:',
        event.data.type
      );

      switch (event.data.type) {
        case 'AUTH_UPDATE':
          if (event.data.payload) {
            await handleAuthUpdate(event.data.payload);
          }
          break;

        case 'ORG_SWITCH':
          if (event.data.payload?.orgSlug) {
            handleOrgSwitch(event.data.payload.orgSlug);
          }
          break;

        case 'LOGOUT':
          await handleLogout();
          break;

        case 'AUTH_REQUEST':
          // Parent is requesting current auth state
          // Could send back current session info if needed
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Send ready message when component mounts
    const readyTimer = setTimeout(sendReadyMessage, 100);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(readyTimer);
    };
  }, [
    checkIfEmbedded,
    handleAuthUpdate,
    handleOrgSwitch,
    handleLogout,
    sendReadyMessage,
    getAllowedParentOrigins,
  ]);

  // Re-send ready message if needed
  useEffect(() => {
    if (state.isEmbedded && !state.isReady) {
      const timer = setTimeout(sendReadyMessage, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isEmbedded, state.isReady, sendReadyMessage]);

  // Show security warning if embedding is blocked
  if (state.isEmbeddingBlocked) {
    return (
      <ParentCommunicationContext.Provider value={state}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>🔒 Embedding Blocked</h1>
          <p style={{ color: '#666', marginBottom: '8px' }}>
            This application cannot be embedded by this website for security reasons.
          </p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Please access the application directly or contact your administrator.
          </p>
        </div>
      </ParentCommunicationContext.Provider>
    );
  }

  return (
    <ParentCommunicationContext.Provider value={state}>
      {children}
    </ParentCommunicationContext.Provider>
  );
}

// Simple hook that only returns state - no side effects
export function useParentCommunication(): ParentCommState {
  const context = useContext(ParentCommunicationContext);
  if (!context) {
    throw new Error('useParentCommunication must be used within a ParentCommunicationProvider');
  }
  return context;
}

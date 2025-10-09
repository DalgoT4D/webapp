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
}

const ParentCommunicationContext = createContext<ParentCommState | null>(null);

export function ParentCommunicationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUser = session?.user as ExtendedUser;

  const [state, setState] = useState<ParentCommState>({
    isEmbedded: false,
    parentToken: null,
    parentOrgSlug: null,
    hideHeader: false,
    isReady: false,
  });

  // Check if we're in an iframe
  const checkIfEmbedded = useCallback(() => {
    if (typeof window === 'undefined') return false;

    try {
      return window.self !== window.top;
    } catch (e) {
      // Cross-origin iframe will throw an error
      return true;
    }
  }, []);

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

      // Handle org switch through the existing mechanism
      if (orgSlug !== sessionStorage.getItem('parentOrgSlug')) {
        handleOrgSwitch(orgSlug);
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
    });

    // Sign out from NextAuth without redirect (since we're in iframe)
    await signOut({ redirect: false });

    // Redirect to login page to show proper state
    router.push('/login');
  }, [router]);

  // Send ready message to parent
  const sendReadyMessage = useCallback(() => {
    if (state.isEmbedded && window.parent) {
      console.log('[ParentComm Provider] Sending READY message to parent');
      window.parent.postMessage(
        {
          type: 'READY',
          source: 'webapp',
        },
        '*'
      ); // Use '*' for now, can be restricted to parent origin

      setState((prev) => ({ ...prev, isReady: true }));
    }
  }, [state.isEmbedded]);

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
      // Ignore messages not from parent app
      if (event.data?.source !== 'webapp_v2') {
        return;
      }

      console.log('[ParentComm Provider] Received message from parent:', event.data.type);

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
  }, [checkIfEmbedded, handleAuthUpdate, handleOrgSwitch, handleLogout, sendReadyMessage]);

  // Re-send ready message if needed
  useEffect(() => {
    if (state.isEmbedded && !state.isReady) {
      const timer = setTimeout(sendReadyMessage, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isEmbedded, state.isReady, sendReadyMessage]);

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

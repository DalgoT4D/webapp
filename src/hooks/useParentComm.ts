import { useEffect, useState, useCallback } from 'react';
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

export function useParentCommunication() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Type assertion for session with our extended user type
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
    try {
      return window.self !== window.top;
    } catch (e) {
      // Cross-origin iframe will throw an error
      return true;
    }
  }, []);

  // Handle organization switch
  const handleOrgSwitch = useCallback((orgSlug: string) => {
    console.log('[Child] Switching to organization:', orgSlug);

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
        console.warn('[Child] Received incomplete auth update');
        return;
      }

      console.log('[Child] Handling auth update with org:', orgSlug);

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
        console.log('[Child] Signing in with parent token using embed-token provider');

        try {
          const result = await signIn('embed-token', {
            token,
            redirect: false, // Don't redirect automatically
          });

          if (result?.ok) {
            console.log('[Child] Successfully authenticated with parent token');
            // Refresh session to get updated user data
            await getSession();
          } else {
            console.error('[Child] Failed to authenticate with parent token:', result?.error);
            return;
          }
        } catch (error) {
          console.error('[Child] Error during token authentication:', error);
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
    console.log('[Child] Received logout signal from parent');

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
      console.log('[Child] Sending READY message to parent');
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

  // Initialize communication
  useEffect(() => {
    const isEmbedded = checkIfEmbedded();

    setState((prev) => ({
      ...prev,
      isEmbedded,
      hideHeader: isEmbedded, // Hide header when embedded
    }));

    if (!isEmbedded) {
      console.log('[Child] Not embedded, skipping parent communication');
      return;
    }

    console.log('[Child] Running in iframe, setting up parent communication');

    // Handle messages from parent
    const handleMessage = async (event: MessageEvent<IframeMessage>) => {
      // Ignore messages not from parent app
      if (event.data?.source !== 'webapp_v2') {
        return;
      }

      console.log('[Child] Received message from parent:', event.data.type);

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
          handleLogout();
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

  return state;
}

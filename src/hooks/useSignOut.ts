import { signOut } from 'next-auth/react';

interface UseSignOutOptions {
  callbackUrl?: string;
}

interface UseSignOutReturn {
  handleSignOut: (options?: UseSignOutOptions) => Promise<void>;
}

export function useSignOut(): UseSignOutReturn {
  const handleSignOut = async (options?: UseSignOutOptions) => {
    const callbackUrl = options?.callbackUrl || '/login';

    localStorage.clear();
    // Use next-auth signOut function with redirect to login page
    signOut({ callbackUrl, redirect: true });
  };

  return {
    handleSignOut,
  };
}

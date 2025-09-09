import { useEffect } from 'react';
import { getEmbeddedAuth } from '@/middleware/embeddedAuth';

export default function EmbeddedAuthInit() {
  useEffect(() => {
    // Initialize embedded auth on mount
    const auth = getEmbeddedAuth();

    if (auth) {
      console.log('Embedded auth initialized:', {
        hasToken: !!auth.token,
        org: auth.org,
        hide: auth.hide,
      });

      // Also set it in localStorage temporarily for components that directly read from there
      // This ensures compatibility with existing code that reads org-slug from localStorage
      if (auth.org) {
        localStorage.setItem('org-slug', auth.org);
      }
    }
  }, []);

  return null;
}

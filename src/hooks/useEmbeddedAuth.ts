interface EmbeddedAuthReturn {
  hideHeader: boolean;
  isEmbedded: boolean;
  embedWithHideHeader: boolean;
  clearEmbeddedAuth: () => void;
  embedToken: string | null | undefined;
  embedOrg: string | null | undefined;
  isIframed: boolean;
}

function isIframed(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check if we're the top window
    if (window.self !== window.top) {
      return true;
    }

    // Additional check: compare locations
    return window.location !== window.parent.location;
  } catch (e) {
    // Cross-origin iframe will throw an error when accessing parent properties
    return true;
  }
}

export function useEmbeddedAuth(): EmbeddedAuthReturn {
  if (typeof window === 'undefined') {
    return {
      hideHeader: false,
      isEmbedded: false,
      embedWithHideHeader: false,
      clearEmbeddedAuth: () => {},
      embedOrg: undefined,
      isIframed: false,
      embedToken: undefined,
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const embedHideHeaderQueryParam = urlParams.get('embedHideHeader');
  const embedTokenQueryParam = urlParams.get('embedToken');
  const embedOrgQueryParam = urlParams.get('embedOrg');
  const embedAppQueryParam = urlParams.get('embedApp');

  // Store embedded state whenever we see the embedded parameter
  // keep query params in sync with session storage (in terms of the key)
  if (embedHideHeaderQueryParam) {
    sessionStorage.setItem('embedHideHeader', embedHideHeaderQueryParam);
  }

  if (embedTokenQueryParam) {
    sessionStorage.setItem('embedToken', embedTokenQueryParam);
  }

  if (embedOrgQueryParam) {
    sessionStorage.setItem('embedOrg', embedOrgQueryParam);
    localStorage.setItem('org-slug', embedOrgQueryParam);
  }

  if (embedAppQueryParam) {
    sessionStorage.setItem('embedApp', embedAppQueryParam);
  }

  const clearEmbeddedAuth = () => {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem('embedHideHeader');
    sessionStorage.removeItem('embedToken');
    sessionStorage.removeItem('embedOrg');
    sessionStorage.removeItem('embedApp');
  };

  // Check if we have stored embedded auth or embedded state
  const storedEmbedHideHeader = sessionStorage.getItem('embedHideHeader');
  const storedEmbedApp = sessionStorage.getItem('embedApp');
  const storedEmbedToken = sessionStorage.getItem('embedToken');
  const storedEmbedOrg = sessionStorage.getItem('embedOrg');

  const isIframedOrNot = isIframed();
  const hideHeader =
    storedEmbedHideHeader === null || storedEmbedHideHeader === undefined
      ? false
      : storedEmbedHideHeader === 'true';

  return {
    hideHeader: hideHeader,
    isEmbedded: isIframedOrNot && storedEmbedApp === 'true',
    isIframed: isIframedOrNot,
    embedWithHideHeader: isIframedOrNot && hideHeader,
    embedToken: storedEmbedToken,
    embedOrg: storedEmbedOrg,
    clearEmbeddedAuth,
  };
}

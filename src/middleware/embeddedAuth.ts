// Middleware to handle embedded authentication via query parameters

export function getEmbeddedAuth() {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const org = urlParams.get('org');
  const embedded = urlParams.get('embedded');
  const hide = urlParams.get('hide');

  if (embedded === 'true' && token) {
    // Store in sessionStorage (not localStorage) to avoid persistence issues
    sessionStorage.setItem('embeddedToken', token);
    if (org) {
      sessionStorage.setItem('embeddedOrg', org);
    }
    if (hide) {
      sessionStorage.setItem('embeddedHide', hide);
    }

    return {
      token,
      org,
      hide,
      isEmbedded: true,
    };
  }

  // Check if we have stored embedded auth
  const storedToken = sessionStorage.getItem('embeddedToken');
  const storedOrg = sessionStorage.getItem('embeddedOrg');
  const storedHide = sessionStorage.getItem('embeddedHide');

  if (storedToken) {
    return {
      token: storedToken,
      org: storedOrg,
      hide: storedHide,
      isEmbedded: true,
    };
  }

  return null;
}

export function clearEmbeddedAuth() {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem('embeddedToken');
  sessionStorage.removeItem('embeddedOrg');
  sessionStorage.removeItem('embeddedHide');
}

export function isEmbedded() {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('embedded') === 'true' || sessionStorage.getItem('embeddedToken') !== null;
}

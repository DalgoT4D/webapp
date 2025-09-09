// Middleware to handle embedded authentication via query parameters

export function getEmbeddedAuth() {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const org = urlParams.get('org');
  const embedded = urlParams.get('embedded');
  const hide = urlParams.get('hide');

  // Store embedded state whenever we see the embedded parameter
  if (embedded === 'true') {
    sessionStorage.setItem('isEmbedded', 'true');
    if (token) {
      sessionStorage.setItem('embeddedToken', token);
    }
    if (org) {
      sessionStorage.setItem('embeddedOrg', org);
    }
    if (hide) {
      sessionStorage.setItem('embeddedHide', hide);
    }
  }

  if (embedded === 'true' && token) {
    return {
      token,
      org,
      hide,
      isEmbedded: true,
    };
  }

  // Check if we have stored embedded auth or embedded state
  const storedToken = sessionStorage.getItem('embeddedToken');
  const storedOrg = sessionStorage.getItem('embeddedOrg');
  const storedHide = sessionStorage.getItem('embeddedHide');
  const storedEmbedded = sessionStorage.getItem('isEmbedded');

  if (storedToken || storedEmbedded === 'true') {
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
  sessionStorage.removeItem('isEmbedded');
}

export function isEmbedded() {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  return (
    urlParams.get('embedded') === 'true' ||
    sessionStorage.getItem('embeddedToken') !== null ||
    sessionStorage.getItem('isEmbedded') === 'true'
  );
}

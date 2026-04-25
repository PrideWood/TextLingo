const grantedKey = 'textlingo_access_granted';
const grantedAtKey = 'textlingo_access_granted_at';
const accessCodeKey = 'textlingo_access_code';

export function getStoredAccessCode() {
  if (typeof window === 'undefined') return '';

  try {
    return localStorage.getItem(accessCodeKey) || '';
  } catch {
    return '';
  }
}

export function hasStoredAccessGrant() {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(grantedKey) === 'true';
  } catch {
    return false;
  }
}

export function storeAccessGrant(code: string) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(grantedKey, 'true');
    localStorage.setItem(grantedAtKey, new Date().toISOString());
    localStorage.setItem(accessCodeKey, code.trim());
  } catch {
    // Access still works for the current render; persistence is best-effort.
  }
}

export function clearAccessGrant() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(grantedKey);
    localStorage.removeItem(grantedAtKey);
    localStorage.removeItem(accessCodeKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}

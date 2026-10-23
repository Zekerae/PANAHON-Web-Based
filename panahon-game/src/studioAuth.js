// ==========================================================================
// PANAHON MAP STUDIO CRYPTOGRAPHIC AUTHENTICATION
// Uses one-way salted SHA-256 hashing via Web Crypto API.
// The plaintext PIN is NEVER stored, transmitted, or bundled in code.
// ==========================================================================

const STUDIO_SALT = 'panahon_studio_secret_salt_2026_bsit38';

// Stored strictly as a precomputed salted SHA-256 digest
const DEFAULT_STUDIO_PIN_HASH = '9e228c2555bf4e17a1e1d8a83a3aec4d096896913f3efbdbb6fc5cd2f64d1ef3';

const STORAGE_KEY_PIN_HASH = 'panahon_studio_pin_hash';
const SESSION_KEY_UNLOCKED = 'panahon_studio_unlocked';

/**
 * Computes a salted SHA-256 hex digest of the given PIN.
 */
export async function hashStudioPin(pin) {
  const normalized = String(pin || '').trim();
  const message = `${STUDIO_SALT}:${normalized}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder().encode(message);
    const buf = await window.crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback for non-crypto/older environments
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash) + message.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

/**
 * Checks if the developer PIN matches the stored encrypted hash.
 */
export async function verifyStudioPin(inputPin) {
  try {
    const inputHash = await hashStudioPin(inputPin);
    const expectedHash = localStorage.getItem(STORAGE_KEY_PIN_HASH) || DEFAULT_STUDIO_PIN_HASH;
    return inputHash === expectedHash;
  } catch (err) {
    console.error('Error verifying PIN:', err);
    return false;
  }
}

/**
 * Sets a new developer PIN (stores only the one-way hash).
 */
export async function updateStudioPin(newPin) {
  try {
    const normalized = String(newPin || '').trim();
    if (!normalized || normalized.length < 4) return false;
    const newHash = await hashStudioPin(normalized);
    localStorage.setItem(STORAGE_KEY_PIN_HASH, newHash);
    return true;
  } catch (err) {
    console.error('Error updating PIN:', err);
    return false;
  }
}

/**
 * Resets the PIN back to the default encrypted hash.
 */
export function resetStudioPinToDefault() {
  try {
    localStorage.removeItem(STORAGE_KEY_PIN_HASH);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Checks if the current session is already authenticated.
 */
export function isStudioUnlocked() {
  try {
    return sessionStorage.getItem(SESSION_KEY_UNLOCKED) === 'true';
  } catch (_) {
    return false;
  }
}

/**
 * Marks the session as unlocked or locked.
 */
export function setStudioUnlocked(unlocked = true) {
  try {
    if (unlocked) {
      sessionStorage.setItem(SESSION_KEY_UNLOCKED, 'true');
    } else {
      sessionStorage.removeItem(SESSION_KEY_UNLOCKED);
    }
  } catch (_) {}
}

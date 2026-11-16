import { ROOM_ID_REGEX } from '../config/constants';

/**
 * Generates a cryptographically secure random room identifier.
 * Uses crypto.getRandomValues() to supply 128 bits of entropy.
 * Converts to a URL-safe Base64URL string (alphanumeric, -, _).
 */
export function generateSecureRoomId(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : crypto;
  cryptoObj.getRandomValues(bytes);
  
  // Base64 encode and make URL-safe
  let base64 = '';
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    base64 = '';
    for (let i = 0; i < bytes.length; i++) {
      base64 += bytes[i].toString(16).padStart(2, '0');
    }
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Validates an incoming room identifier against length and character set.
 */
export function isValidRoomId(roomId?: string | null): boolean {
  if (!roomId || typeof roomId !== 'string') return false;
  return ROOM_ID_REGEX.test(roomId);
}

/**
 * Generates a cryptographically random UUID for messages and transfers.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

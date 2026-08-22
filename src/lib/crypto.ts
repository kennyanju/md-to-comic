/**
 * Web Crypto AES-GCM encryption utility
 * Secures client-side API keys and credentials in browser storage
 */

const ENCRYPTION_PREFIX = 'enc:v1:';
const DEFAULT_KEY_SEED = 'md-to-comic-studio-device-seed-v1';

/**
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts a sensitive string using AES-GCM with a random salt & IV
 */
export async function encryptSecret(plainText: string, passphrase?: string): Promise<string> {
  if (!plainText) return '';
  if (plainText.startsWith(ENCRYPTION_PREFIX)) return plainText; // Already encrypted

  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase || DEFAULT_KEY_SEED, salt);

    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );

    const saltB64 = bufferToBase64(salt);
    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(encrypted);

    return `${ENCRYPTION_PREFIX}${saltB64}:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn('Encryption failed, using fallback:', err);
    return plainText;
  }
}

/**
 * Decrypts a sensitive string. If not encrypted with our prefix, returns as-is for backward compatibility.
 */
export async function decryptSecret(cipherText: string, passphrase?: string): Promise<string> {
  if (!cipherText) return '';
  if (!cipherText.startsWith(ENCRYPTION_PREFIX)) {
    return cipherText; // Plaintext legacy key
  }

  try {
    const raw = cipherText.slice(ENCRYPTION_PREFIX.length);
    const [saltB64, ivB64, cipherB64] = raw.split(':');
    if (!saltB64 || !ivB64 || !cipherB64) return '';

    const salt = base64ToBuffer(saltB64);
    const iv = base64ToBuffer(ivB64);
    const encrypted = base64ToBuffer(cipherB64);

    const key = await deriveKey(passphrase || DEFAULT_KEY_SEED, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      encrypted as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '';
  }
}

/**
 * Safe cross-platform UUID generator
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

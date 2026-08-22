import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret, generateUUID } from '../lib/crypto';

describe('Web Crypto Key Encryption', () => {
  it('should encrypt and decrypt a sensitive API key correctly', async () => {
    const original = 'sk-or-v1-abc123secretkey';
    const encrypted = await encryptSecret(original);

    expect(encrypted).not.toEqual(original);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);

    const decrypted = await decryptSecret(encrypted);
    expect(decrypted).toEqual(original);
  });

  it('should transparently return plaintext for legacy unencrypted keys', async () => {
    const legacyKey = 'sk-or-v1-legacy-plain-token';
    const result = await decryptSecret(legacyKey);
    expect(result).toEqual(legacyKey);
  });

  it('should handle empty strings safely', async () => {
    expect(await encryptSecret('')).toEqual('');
    expect(await decryptSecret('')).toEqual('');
  });

  it('should generate valid RFC4122 v4 UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();

    expect(uuid1).not.toEqual(uuid2);
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

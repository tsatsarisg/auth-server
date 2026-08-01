import { scryptSync, randomBytes } from 'crypto';
import { NodePasswordHasher } from './scrypt-password-hasher.js';

describe('NodePasswordHasher', () => {
  const hasher = new NodePasswordHasher();

  it('hashes with versioned parameters and verifies the round trip', async () => {
    const stored = await hasher.hash('correct horse battery staple');

    expect(stored).toMatch(/^scrypt\$N=32768,r=8,p=1\$[0-9a-f]+:[0-9a-f]+$/);
    await expect(hasher.compare('correct horse battery staple', stored)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hasher.hash('correct horse battery staple');
    await expect(hasher.compare('incorrect horse', stored)).resolves.toBe(false);
  });

  it('produces unique hashes for the same password (random salt)', async () => {
    const [a, b] = await Promise.all([hasher.hash('same-password'), hasher.hash('same-password')]);
    expect(a).not.toBe(b);
  });

  it('verifies the legacy unversioned salt:hash format', async () => {
    const salt = randomBytes(16);
    const derived = scryptSync('legacy-password', salt, 64);
    const legacyStored = `${salt.toString('hex')}:${derived.toString('hex')}`;

    await expect(hasher.compare('legacy-password', legacyStored)).resolves.toBe(true);
    await expect(hasher.compare('wrong-password', legacyStored)).resolves.toBe(false);
  });

  it('rejects tampered stored hashes', async () => {
    const stored = await hasher.hash('password1234');
    const tampered = stored.slice(0, -2) + (stored.endsWith('00') ? '11' : '00');
    await expect(hasher.compare('password1234', tampered)).resolves.toBe(false);
  });

  it.each(['', 'garbage', 'scrypt$bad$format', 'scrypt$N=1,r=1$missing-colon'])(
    'returns false for malformed stored value %p instead of throwing',
    async (malformed) => {
      await expect(hasher.compare('password1234', malformed)).resolves.toBe(false);
    },
  );
});

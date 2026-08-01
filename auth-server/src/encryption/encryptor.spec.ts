import { randomBytes } from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';
import { Encryptor } from './encryptor.js';

describe('Encryptor', () => {
  const encryptor = new Encryptor(randomBytes(32).toString('base64'));

  it('round-trips plaintext through AES-256-GCM', () => {
    const ciphertext = encryptor.encrypt('scrypt$N=32768,r=8,p=1$aa:bb');
    expect(encryptor.decrypt(ciphertext)).toBe('scrypt$N=32768,r=8,p=1$aa:bb');
  });

  it('uses a fresh IV per encryption', () => {
    expect(encryptor.encrypt('same input')).not.toBe(encryptor.encrypt('same input'));
  });

  it('rejects tampered ciphertext (GCM auth tag)', () => {
    const [iv, cipher, tag] = encryptor.encrypt('sensitive').split(':');
    const flipped = Buffer.from(cipher!, 'base64');
    flipped[0] = flipped[0]! ^ 0xff;
    const tampered = `${iv}:${flipped.toString('base64')}:${tag}`;

    expect(() => encryptor.decrypt(tampered)).toThrow(InternalServerErrorException);
  });

  it('rejects malformed payloads', () => {
    expect(() => encryptor.decrypt('not-a-valid-payload')).toThrow(InternalServerErrorException);
  });

  it('refuses keys that are not 32 bytes', () => {
    const shortKey = new Encryptor(Buffer.alloc(16).toString('base64'));
    expect(() => shortKey.encrypt('x')).toThrow(InternalServerErrorException);
  });
});

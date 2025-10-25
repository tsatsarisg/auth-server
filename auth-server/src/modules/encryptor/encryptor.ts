import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export default class Encryptor {
  constructor(private readonly base64Key: string) {
    if (!base64Key)
      throw new InternalServerErrorException('Encryption key not provided');
  }

  private getKey(): Buffer {
    const buf = Buffer.from(this.base64Key, 'base64');
    if (buf.length !== 32)
      throw new InternalServerErrorException(
        'Encryption key must be 32 bytes (base64)',
      );
    return buf;
  }

  // returns base64 string: iv:ciphertext:tag
  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = randomBytes(12); // 96-bit for GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${ciphertext.toString('base64')}:${tag.toString('base64')}`;
  }

  decrypt(payload: string): string {
    try {
      const [ivB, cipherB, tagB] = payload.split(':');
      if (!ivB || !cipherB || !tagB) throw new Error('invalid payload');
      const iv = Buffer.from(ivB, 'base64');
      const ciphertext = Buffer.from(cipherB, 'base64');
      const tag = Buffer.from(tagB, 'base64');
      const key = this.getKey();
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new InternalServerErrorException('Decryption failed');
    }
  }
}

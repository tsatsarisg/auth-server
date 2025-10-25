import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export default class NodePasswordHasher {
  private readonly saltBytes = 16;
  private readonly keyLen = 64;

  async hash(plain: string): Promise<string> {
    const salt = randomBytes(this.saltBytes);
    const derived = (await scrypt(plain, salt, this.keyLen)) as Buffer;
    return `${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  async compare(plain: string, stored: string): Promise<boolean> {
    try {
      const [saltHex, derivedHex] = stored.split(':');
      if (!saltHex || !derivedHex) return false;
      const salt = Buffer.from(saltHex, 'hex');
      const derived = Buffer.from(derivedHex, 'hex');
      const derivedCheck = (await scrypt(
        plain,
        salt,
        derived.length,
      )) as Buffer;

      if (derivedCheck.length !== derived.length) return false;
      return timingSafeEqual(derived, derivedCheck);
    } catch {
      return false;
    }
  }
}

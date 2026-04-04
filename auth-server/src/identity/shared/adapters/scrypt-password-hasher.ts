import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;
const KEY_LEN = 64;
const SALT_BYTES = 16;
const VERSION_PREFIX = `scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}`;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const cb = (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      else resolve(derivedKey);
    };
    if (options) {
      scrypt(password, salt, keylen, options, cb);
    } else {
      scrypt(password, salt, keylen, cb);
    }
  });
}

@Injectable()
export class NodePasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const derived = await scryptAsync(plain, salt, KEY_LEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: SCRYPT_MAXMEM,
    });
    return `${VERSION_PREFIX}$${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  async compare(plain: string, stored: string): Promise<boolean> {
    try {
      // Support versioned format: scrypt$N=...,r=...,p=...$salt:hash
      if (stored.startsWith('scrypt$')) {
        const parts = stored.split('$');
        // parts: ["scrypt", "N=32768,r=8,p=1", "salt:hash"]
        if (parts.length !== 3) return false;
        const paramStr = parts[1];
        const hashPart = parts[2];
        if (!paramStr || !hashPart) return false;
        const params = this.parseParams(paramStr);
        if (!params) return false;

        const [saltHex, derivedHex] = hashPart.split(':');
        if (!saltHex || !derivedHex) return false;

        const salt = Buffer.from(saltHex, 'hex');
        const derived = Buffer.from(derivedHex, 'hex');
        const derivedCheck = await scryptAsync(plain, salt, derived.length, {
          N: params.N,
          r: params.r,
          p: params.p,
          maxmem: SCRYPT_MAXMEM,
        });

        if (derivedCheck.length !== derived.length) return false;
        return timingSafeEqual(derived, derivedCheck);
      }

      // Legacy format: salt:hash (no version prefix)
      const [saltHex, derivedHex] = stored.split(':');
      if (!saltHex || !derivedHex) return false;
      const salt = Buffer.from(saltHex, 'hex');
      const derived = Buffer.from(derivedHex, 'hex');
      const derivedCheck = await scryptAsync(plain, salt, derived.length);

      if (derivedCheck.length !== derived.length) return false;
      return timingSafeEqual(derived, derivedCheck);
    } catch {
      return false;
    }
  }

  private parseParams(paramStr: string): { N: number; r: number; p: number } | null {
    const map: Record<string, number> = {};
    for (const pair of paramStr.split(',')) {
      const [key, val] = pair.split('=');
      if (!key || !val) return null;
      map[key] = Number(val);
    }
    const N = map['N'];
    const r = map['r'];
    const p = map['p'];
    if (!N || !r || !p) return null;
    return { N, r, p };
  }
}

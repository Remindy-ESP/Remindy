import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    const raw = process.env.MFA_SECRET_KEY;
    if (!raw) throw new Error('MFA_SECRET_KEY is missing');
    this.key = crypto.createHash('sha256').update(raw).digest();
  }

  encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
  }

  decrypt(packed: string): string {
    const parts = packed.split('.');
    if (parts.length !== 3) {
      return packed;
    }

    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);

    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    return plain.toString('utf8');
  }

  isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    return value.split('.').length === 3;
  }
}

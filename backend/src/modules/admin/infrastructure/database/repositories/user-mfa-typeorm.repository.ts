import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { CryptoService } from '../../services/crypto.service';

@Injectable()
export class UserMfaTypeOrmRepository {
  constructor(
    @InjectRepository(EUser)
    private readonly users: Repository<EUser>,
    private readonly crypto: CryptoService,
  ) {}

  async findByIdForMfa(userId: string) {
    return this.users.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role_key', 'mfaEnabled', 'mfaSecret'],
    });
  }

  async setSecret(userId: string, secret: string) {
    const encrypted = this.crypto.encrypt(secret);
    await this.users.update({ id: userId }, { mfaSecret: encrypted });
  }

  async enable(userId: string) {
    await this.users.update({ id: userId }, { mfaEnabled: true });
  }

  async getDecryptedSecret(userId: string): Promise<string | null> {
    const user = await this.findByIdForMfa(userId);
    if (!user?.mfaSecret) return null;
    return this.crypto.decrypt(user.mfaSecret);
  }

  async incrementFailedLogin(userId: string) {
    await this.users.increment({ id: userId }, 'failedLoginCount', 1);
  }
  async ensureEncryptedSecret(userId: string) {
    const user = await this.findByIdForMfa(userId);
    if (!user?.mfaSecret) return;

    if (!this.crypto.isEncrypted(user.mfaSecret)) {
      const encrypted = this.crypto.encrypt(user.mfaSecret);
      await this.users.update({ id: userId }, { mfaSecret: encrypted });
    }
  }
  async resetFailedLogin(userId: string) {
    await this.users.update({ id: userId }, { failedLoginCount: 0 });
  }
}

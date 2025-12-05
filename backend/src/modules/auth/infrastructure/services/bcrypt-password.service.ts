import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordService } from '../../domain/services/password.service';

@Injectable()
export class BcryptPasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

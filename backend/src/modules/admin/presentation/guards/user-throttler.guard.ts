import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request & { user?: { id?: string } }): Promise<string> {
    if (req.user?.id) return Promise.resolve(`user:${req.user.id}`);
    return Promise.resolve(req.ip ?? 'ip:unknown');
  }
}

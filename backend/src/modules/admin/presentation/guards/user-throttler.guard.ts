import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request & { user?: { id?: string } }): Promise<string> {
    if (req.user?.id) return `user:${req.user.id}`;

    return req.ip ?? 'ip:unknown';
  }
}

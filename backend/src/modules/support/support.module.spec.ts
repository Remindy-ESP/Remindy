import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupportModule } from './support.module';
import {
  EUser,
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { AuthModule } from '../auth/auth.module';

describe('SupportModule', () => {
  it('compiles the module', async () => {
    const module = await Test.createTestingModule({
      imports: [SupportModule],
    })
      .overrideModule(AuthModule)
      .useModule({ module: class FakeAuthModule {}, exports: [] } as any)
      .overrideProvider(getRepositoryToken(EUser))
      .useValue({})
      .overrideProvider(getRepositoryToken(SupportTicketEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(SupportTicketMessageEntity))
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });
});

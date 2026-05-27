import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin.module';
import { AdminSecurityService } from './application/admin-security.service';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';

describe('AdminModule', () => {
  it('is defined', () => {
    expect(AdminModule).toBeDefined();
  });

  it('declares imports metadata', () => {
    const importsMeta = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AdminModule);
    expect(importsMeta).toBeDefined();
    expect(importsMeta.length).toBeGreaterThan(0);
  });

  it('resolves forwardRef imports', () => {
    const importsMeta = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AdminModule);

    const authForwardRef = importsMeta.find(
      (item: any) => typeof item?.forwardRef === 'function' && item.forwardRef() === AuthModule,
    );
    const documentForwardRef = importsMeta.find(
      (item: any) => typeof item?.forwardRef === 'function' && item.forwardRef() === DocumentModule,
    );

    expect(authForwardRef).toBeDefined();
    expect(authForwardRef.forwardRef()).toBe(AuthModule);

    expect(documentForwardRef).toBeDefined();
    expect(documentForwardRef.forwardRef()).toBe(DocumentModule);
  });

  it('declares TypeOrm feature import', () => {
    const importsMeta = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AdminModule);

    expect(importsMeta.some((item: any) => item?.module === TypeOrmModule)).toBe(true);
  });

  it('declares controllers metadata', () => {
    const controllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, AdminModule);
    expect(controllers).toBeDefined();
    expect(controllers.length).toBeGreaterThan(0);
  });

  it('declares providers metadata', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AdminModule);
    expect(providers).toBeDefined();
    expect(providers.length).toBeGreaterThan(0);
    expect(providers).toContain(AdminSecurityService);
  });

  it('declares exports metadata', () => {
    const exportsMeta = Reflect.getMetadata(MODULE_METADATA.EXPORTS, AdminModule);
    expect(exportsMeta).toBeDefined();
    expect(exportsMeta).toContain(AdminSecurityService);
  });
});

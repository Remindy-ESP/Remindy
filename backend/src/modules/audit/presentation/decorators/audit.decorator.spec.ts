import 'reflect-metadata';
import { AUDIT_KEY, Audit } from './audit.decorator';
import { Severity } from '../../domain/enums/severity.enum';

describe('@Audit decorator', () => {
  it('should set audit metadata on method', () => {
    class TestController {
      @Audit({
        action: 'user.ban',
        resourceType: 'user',
        resourceIdParam: 'id',
      })
      banUser() {}
    }

    const metadata = Reflect.getMetadata(AUDIT_KEY, TestController.prototype.banUser);

    expect(metadata).toEqual({
      action: 'user.ban',
      resourceType: 'user',
      resourceIdParam: 'id',
    });
  });

  it('should preserve full audit config with severity and body resource id', () => {
    class TestController {
      @Audit({
        action: 'subscription.create',
        resourceType: 'subscription',
        resourceIdBody: 'id',
        severity: Severity.CRITICAL,
      })
      createSubscription() {}
    }

    const metadata = Reflect.getMetadata(AUDIT_KEY, TestController.prototype.createSubscription);

    expect(metadata).toEqual({
      action: 'subscription.create',
      resourceType: 'subscription',
      resourceIdBody: 'id',
      severity: Severity.CRITICAL,
    });
  });
});

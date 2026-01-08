import { SubscriptionModule } from './subscription.module';

describe('SubscriptionModule', () => {
  it('should be defined', () => {
    expect(SubscriptionModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof SubscriptionModule).toBe('function');
  });

  it('should have module metadata', () => {
    const metadata = Reflect.getMetadata('imports', SubscriptionModule);
    expect(metadata).toBeDefined();
  });

  it('should have providers metadata', () => {
    const metadata = Reflect.getMetadata('providers', SubscriptionModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });

  it('should have controllers metadata', () => {
    const metadata = Reflect.getMetadata('controllers', SubscriptionModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });

  it('should have exports metadata', () => {
    const metadata = Reflect.getMetadata('exports', SubscriptionModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });
});

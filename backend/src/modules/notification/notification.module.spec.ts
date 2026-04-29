import { NotificationModule } from './notification.module';

describe('NotificationModule', () => {
  it('should be defined', () => {
    expect(NotificationModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof NotificationModule).toBe('function');
  });

  it('should have module metadata', () => {
    const metadata = Reflect.getMetadata('imports', NotificationModule);
    expect(metadata).toBeDefined();
  });

  it('should have providers metadata', () => {
    const metadata = Reflect.getMetadata('providers', NotificationModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });

  it('should have controllers metadata', () => {
    const metadata = Reflect.getMetadata('controllers', NotificationModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });

  it('should have exports metadata', () => {
    const metadata = Reflect.getMetadata('exports', NotificationModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });
});

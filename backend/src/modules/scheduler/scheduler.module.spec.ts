import { SchedulerModule } from './scheduler.module';

describe('SchedulerModule', () => {
  it('should be defined', () => {
    expect(SchedulerModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof SchedulerModule).toBe('function');
  });

  it('should have module metadata', () => {
    const metadata = Reflect.getMetadata('imports', SchedulerModule);
    expect(metadata).toBeDefined();
  });

  it('should have providers metadata', () => {
    const metadata = Reflect.getMetadata('providers', SchedulerModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });
});

import { SeedModule } from './seed.module';

describe('SeedModule', () => {
  it('should be defined', () => {
    expect(SeedModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof SeedModule).toBe('function');
  });

  it('should have module metadata', () => {
    const metadata = Reflect.getMetadata('imports', SeedModule);
    expect(metadata).toBeDefined();
  });

  it('should have providers metadata', () => {
    const metadata = Reflect.getMetadata('providers', SeedModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });

  it('should have controllers metadata', () => {
    const metadata = Reflect.getMetadata('controllers', SeedModule);
    expect(metadata).toBeDefined();
    expect(Array.isArray(metadata)).toBe(true);
  });
});

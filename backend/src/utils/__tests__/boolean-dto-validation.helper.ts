import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Shared test helper for DTOs that have an optional boolean `force` field.
 * Eliminates duplicated validation test logic across DTO spec files.
 */
export async function validateForceField<T extends object>(
  DtoClass: new () => T,
  value: any,
): Promise<{ dto: T; errors: ReturnType<typeof validate> extends Promise<infer R> ? R : never }> {
  const dto = plainToClass(DtoClass, { force: value });
  const errors = await validate(dto);
  return { dto, errors };
}

/**
 * Registers shared "force" boolean validation tests for a given DTO class.
 * Each DTO spec can call this and only add its own specific tests.
 */
export function describeForceBooleanValidation<T extends object>(
  DtoClass: new () => T,
): void {
  it('should accept force as true', async () => {
    const { dto, errors } = await validateForceField(DtoClass, true);
    expect(errors).toHaveLength(0);
    expect((dto as any).force).toBe(true);
  });

  it('should accept force as false', async () => {
    const { dto, errors } = await validateForceField(DtoClass, false);
    expect(errors).toHaveLength(0);
    expect((dto as any).force).toBe(false);
  });

  it('should reject non-boolean force value', async () => {
    const { errors } = await validateForceField(DtoClass, 'not-a-boolean');
    const forceError = errors.find((e) => e.property === 'force');
    expect(forceError).toBeDefined();
    expect(forceError?.constraints).toHaveProperty('isBoolean');
  });
}

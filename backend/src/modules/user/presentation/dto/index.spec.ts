import * as dtoIndex from './index';

describe('user/presentation/dto/index', () => {
  it('re-exports the DTO modules', () => {
    expect(dtoIndex).toBeDefined();
    expect(Object.keys(dtoIndex).length).toBeGreaterThan(0);
  });
});

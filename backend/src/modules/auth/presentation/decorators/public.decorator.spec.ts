import 'reflect-metadata';
import { Public } from './public.decorator';

describe('Public decorator', () => {
  it('sets isPublic metadata to true on a method', () => {
    class TestController {
      @Public()
      publicRoute() {
        return true;
      }
    }

    const metadata = Reflect.getMetadata('isPublic', TestController.prototype.publicRoute);

    expect(metadata).toBe(true);
  });
});

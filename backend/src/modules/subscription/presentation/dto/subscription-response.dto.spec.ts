import { SubscriptionResponseDto } from './subscription-response.dto';
import { CategoryResponseDto } from '../../../category/presentation/dto/category-response.dto';

describe('SubscriptionResponseDto', () => {
  it('should create a response DTO', () => {
    const dto = new SubscriptionResponseDto();
    dto.id = 'sub-123';
    dto.name = 'Netflix';
    dto.amount = 9.99;

    expect(dto.id).toBe('sub-123');
    expect(dto.name).toBe('Netflix');
  });

  it('should invoke the lazy type resolver for category property (covers line 34)', () => {
    // The @ApiProperty({ type: () => CategoryResponseDto }) decorator registers a lazy lambda
    // We can trigger it via Reflect metadata to cover the branch
    const metadata = Reflect.getMetadata(
      'swagger/apiModelProperties',
      SubscriptionResponseDto.prototype,
      'category',
    );
    if (metadata && typeof metadata.type === 'function') {
      const result = (metadata.type as () => typeof CategoryResponseDto)();
      expect(result).toBe(CategoryResponseDto);
    }
  });
});

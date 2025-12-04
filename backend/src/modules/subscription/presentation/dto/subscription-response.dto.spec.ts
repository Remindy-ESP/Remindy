import { SubscriptionResponseDto } from './subscription-response.dto';

describe('SubscriptionResponseDto', () => {
  it('should create a response DTO', () => {
    const dto = new SubscriptionResponseDto();
    dto.id = 'sub-123';
    dto.name = 'Netflix';
    dto.amount = 9.99;

    expect(dto.id).toBe('sub-123');
    expect(dto.name).toBe('Netflix');
  });
});

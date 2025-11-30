import { EventResponseDto } from './event-response.dto';

describe('EventResponseDto', () => {
  it('should create a response DTO', () => {
    const dto: EventResponseDto = {
      id: 'event-123',
      subscriptionId: 'sub-123',
      title: 'Monthly Payment',
      amount: 9.99,
      startsAt: '2025-01-01T10:00:00.000Z',
      status: 'scheduled',
      createdAt: '2025-01-01T10:00:00.000Z',
      updatedAt: '2025-01-01T10:00:00.000Z',
    };

    expect(dto.id).toBe('event-123');
    expect(dto.status).toBe('scheduled');
  });
});

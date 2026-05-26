import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MySupportTicketsQueryDto } from './my-support-tickets-query.dto';
import { SupportTicketStatus } from '../../domain/enums/support-ticket-status.enum';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

async function validateDto(plain: object): Promise<string[]> {
  const instance = plainToInstance(MySupportTicketsQueryDto, plain);
  const errors = await validate(instance);
  return errors.flatMap(e => Object.values(e.constraints ?? {}));
}

describe('MySupportTicketsQueryDto', () => {
  it('accepts a valid full payload', async () => {
    const errors = await validateDto({
      status: SupportTicketStatus.OPEN,
      category: SupportTicketCategory.BILLING,
      page: '2',
      limit: '50',
    });
    expect(errors).toHaveLength(0);
  });

  it('uses default values when page and limit are omitted', () => {
    const dto = plainToInstance(MySupportTicketsQueryDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('transforms string page and limit to numbers', () => {
    const dto = plainToInstance(MySupportTicketsQueryDto, { page: '3', limit: '25' });
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(25);
  });

  it('rejects page less than 1', async () => {
    const errors = await validateDto({ page: '0' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.toLowerCase().includes('page'))).toBe(true);
  });

  it('rejects limit greater than 100', async () => {
    const errors = await validateDto({ limit: '101' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.toLowerCase().includes('limit'))).toBe(true);
  });

  it('rejects an invalid status value', async () => {
    const errors = await validateDto({ status: 'invalid_status' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects an invalid category value', async () => {
    const errors = await validateDto({ category: 'invalid_category' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts payload with only optional fields omitted', async () => {
    const errors = await validateDto({ page: '1', limit: '10' });
    expect(errors).toHaveLength(0);
  });
});

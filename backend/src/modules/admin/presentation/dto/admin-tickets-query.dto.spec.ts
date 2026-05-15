import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminTicketsQueryDto } from './admin-tickets-query.dto';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from 'src/modules/support/domain/enums/support-ticket-priority.enum';
import { SupportTicketCategory } from 'src/modules/support/domain/enums/support-ticket-category.enum';

describe('AdminTicketsQueryDto', () => {
  it('applies defaults and transforms page/limit', () => {
    const dto = plainToInstance(AdminTicketsQueryDto, {
      status: SupportTicketStatus.OPEN,
      page: '2',
      limit: '25',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(25);
    expect(new AdminTicketsQueryDto().sortBy).toBe('createdAt');
    expect(new AdminTicketsQueryDto().sortDir).toBe('DESC');
  });

  it('accepts a fully valid payload', () => {
    const dto = plainToInstance(AdminTicketsQueryDto, {
      status: SupportTicketStatus.PENDING_USER,
      priority: SupportTicketPriority.HIGH,
      category: SupportTicketCategory.TECHNICAL,
      sortBy: 'priority',
      sortDir: 'ASC',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.priority).toBe(SupportTicketPriority.HIGH);
    expect(dto.category).toBe(SupportTicketCategory.TECHNICAL);
    expect(dto.sortBy).toBe('priority');
    expect(dto.sortDir).toBe('ASC');
  });

  it('rejects invalid page and limit', () => {
    const dto = plainToInstance(AdminTicketsQueryDto, { page: '0', limit: '500' });

    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['page', 'limit']));
  });
});

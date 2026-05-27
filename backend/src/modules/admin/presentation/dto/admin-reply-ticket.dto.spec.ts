import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminReplyTicketDto } from './admin-reply-ticket.dto';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';

describe('AdminReplyTicketDto', () => {
  it('accepts a valid message without status', () => {
    const dto = plainToInstance(AdminReplyTicketDto, { message: 'Bonjour' });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.status).toBeUndefined();
  });

  it('accepts a valid status when provided', () => {
    const dto = plainToInstance(AdminReplyTicketDto, {
      message: 'Résolu',
      status: SupportTicketStatus.CLOSED,
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.status).toBe(SupportTicketStatus.CLOSED);
  });

  it('rejects an empty message and an invalid status', () => {
    const dto = plainToInstance(AdminReplyTicketDto, {
      message: '',
      status: 'oops',
    });

    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['message', 'status']));
  });
});

import { BadRequestException } from '@nestjs/common';
import { AdminTicketsPolicy } from './admin-tickets.policy';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';

describe('AdminTicketsPolicy.assertReplyAllowed()', () => {
  it('throws BadRequestException when ticket is CLOSED', () => {
    expect(() => AdminTicketsPolicy.assertReplyAllowed(SupportTicketStatus.CLOSED)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException with correct message for CLOSED status', () => {
    expect(() => AdminTicketsPolicy.assertReplyAllowed(SupportTicketStatus.CLOSED)).toThrow(
      'Closed tickets cannot be replied to',
    );
  });

  it('does not throw for OPEN status', () => {
    expect(() => AdminTicketsPolicy.assertReplyAllowed(SupportTicketStatus.OPEN)).not.toThrow();
  });

  it('does not throw for PENDING_USER status', () => {
    expect(() =>
      AdminTicketsPolicy.assertReplyAllowed(SupportTicketStatus.PENDING_USER),
    ).not.toThrow();
  });

  it('does not throw for RESOLVED status', () => {
    expect(() => AdminTicketsPolicy.assertReplyAllowed(SupportTicketStatus.RESOLVED)).not.toThrow();
  });
});

describe('AdminTicketsPolicy.resolveNextStatus()', () => {
  it('returns PENDING_USER when no status provided (default)', () => {
    const result = AdminTicketsPolicy.resolveNextStatus();
    expect(result).toBe(SupportTicketStatus.PENDING_USER);
  });

  it('returns PENDING_USER when inputStatus is undefined', () => {
    const result = AdminTicketsPolicy.resolveNextStatus(undefined);
    expect(result).toBe(SupportTicketStatus.PENDING_USER);
  });

  it('returns CLOSED when CLOSED is passed', () => {
    const result = AdminTicketsPolicy.resolveNextStatus(SupportTicketStatus.CLOSED);
    expect(result).toBe(SupportTicketStatus.CLOSED);
  });

  it('returns RESOLVED when RESOLVED is passed', () => {
    const result = AdminTicketsPolicy.resolveNextStatus(SupportTicketStatus.RESOLVED);
    expect(result).toBe(SupportTicketStatus.RESOLVED);
  });

  it('returns PENDING_USER when PENDING_USER is passed', () => {
    const result = AdminTicketsPolicy.resolveNextStatus(SupportTicketStatus.PENDING_USER);
    expect(result).toBe(SupportTicketStatus.PENDING_USER);
  });

  it('throws BadRequestException when OPEN is passed', () => {
    expect(() => AdminTicketsPolicy.resolveNextStatus(SupportTicketStatus.OPEN)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException with correct message when OPEN is passed', () => {
    expect(() => AdminTicketsPolicy.resolveNextStatus(SupportTicketStatus.OPEN)).toThrow(
      'Admin reply cannot set ticket status to open',
    );
  });
});

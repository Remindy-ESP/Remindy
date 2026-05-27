import { TicketsPaginationQueryDto } from './tickets-pagination-query.dto';

/** Query for a user listing their own support tickets (status/category + pagination). */
export class MySupportTicketsQueryDto extends TicketsPaginationQueryDto {}

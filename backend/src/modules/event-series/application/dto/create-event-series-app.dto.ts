export class CreateEventSeriesAppDto {
  subscriptionId: string;
  rrule: string;
  dtstart: Date;
  timezone?: string;
  exdates?: Date[];
  rdates?: Date[];
}

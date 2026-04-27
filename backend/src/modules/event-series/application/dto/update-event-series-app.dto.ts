export class UpdateEventSeriesAppDto {
  rrule?: string;
  dtstart?: Date;
  timezone?: string;
  exdates?: Date[];
  rdates?: Date[];
}

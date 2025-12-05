import { Injectable, Inject } from '@nestjs/common';
import { RRuleSet, rrulestr } from 'rrule';
import type { IEventSeriesRepository } from '../ports/event-series-repository.interface';
import { EVENT_SERIES_REPOSITORY } from '../ports/event-series-repository.interface';

export interface GeneratedEventOccurrence {
  subscriptionId: string;
  eventSeriesId: string;
  startsAt: Date;
}

@Injectable()
export class GenerateEventsFromSeriesUseCase {
  constructor(
    @Inject(EVENT_SERIES_REPOSITORY)
    private readonly repository: IEventSeriesRepository,
  ) {}

  /**
   * Generate event occurrences from event series RRULE
   * @param eventSeriesId - ID of the event series
   * @param startDate - Start date for generation window
   * @param endDate - End date for generation window
   * @param maxOccurrences - Maximum number of occurrences to generate (default: 365)
   * @returns Array of event occurrences
   */
  async execute(
    eventSeriesId: string,
    startDate: Date,
    endDate: Date,
    maxOccurrences: number = 365,
  ): Promise<GeneratedEventOccurrence[]> {
    const eventSeries = await this.repository.findById(eventSeriesId);

    if (!eventSeries) {
      throw new Error(`Event series ${eventSeriesId} not found`);
    }

    // Parse RRULE - rrulestr can return either RRule or RRuleSet
    const parsedRule = rrulestr(eventSeries.rrule, {
      dtstart: eventSeries.dtstart,
      tzid: eventSeries.timezone,
    });

    // Create RRuleSet to handle EXDATE and RDATE
    const rruleSet = new RRuleSet();

    // Add the parsed rule to the set
    if (parsedRule instanceof RRuleSet) {
      // If it's already an RRuleSet, merge its rules
      parsedRule.rrules().forEach(r => rruleSet.rrule(r));
    } else {
      // If it's a single RRule, add it
      rruleSet.rrule(parsedRule);
    }

    // Add exception dates (dates to exclude)
    if (eventSeries.exdates && eventSeries.exdates.length > 0) {
      eventSeries.exdates.forEach((exdate: Date) => {
        rruleSet.exdate(exdate);
      });
    }

    // Add additional recurrence dates
    if (eventSeries.rdates && eventSeries.rdates.length > 0) {
      eventSeries.rdates.forEach((rdate: Date) => {
        rruleSet.rdate(rdate);
      });
    }

    // Generate occurrences within the date range
    const occurrences = rruleSet.between(startDate, endDate, true);

    // Limit to maxOccurrences
    const limitedOccurrences = occurrences.slice(0, maxOccurrences);

    // Map to GeneratedEventOccurrence
    return limitedOccurrences.map(date => ({
      subscriptionId: eventSeries.subscriptionId,
      eventSeriesId: eventSeries.id!,
      startsAt: date,
    }));
  }

  /**
   * Generate next N occurrences from now
   * @param eventSeriesId - ID of the event series
   * @param count - Number of occurrences to generate
   * @returns Array of event occurrences
   */
  async generateNext(
    eventSeriesId: string,
    count: number = 12,
  ): Promise<GeneratedEventOccurrence[]> {
    const eventSeries = await this.repository.findById(eventSeriesId);

    if (!eventSeries) {
      throw new Error(`Event series ${eventSeriesId} not found`);
    }

    // Parse RRULE
    const parsedRule = rrulestr(eventSeries.rrule, {
      dtstart: eventSeries.dtstart,
      tzid: eventSeries.timezone,
    });

    // Create RRuleSet
    const rruleSet = new RRuleSet();

    // Add the parsed rule to the set
    if (parsedRule instanceof RRuleSet) {
      parsedRule.rrules().forEach(r => rruleSet.rrule(r));
    } else {
      rruleSet.rrule(parsedRule);
    }

    // Add exception dates
    if (eventSeries.exdates && eventSeries.exdates.length > 0) {
      eventSeries.exdates.forEach((exdate: Date) => {
        rruleSet.exdate(exdate);
      });
    }

    // Add additional recurrence dates
    if (eventSeries.rdates && eventSeries.rdates.length > 0) {
      eventSeries.rdates.forEach((rdate: Date) => {
        rruleSet.rdate(rdate);
      });
    }

    // Generate next N occurrences from now
    const now = new Date();

    // For getting multiple occurrences, we need to use all() with count
    const allOccurrences = rruleSet.all((date, i) => {
      return i < count && date >= now;
    });

    return allOccurrences.map(date => ({
      subscriptionId: eventSeries.subscriptionId,
      eventSeriesId: eventSeries.id!,
      startsAt: date,
    }));
  }
}

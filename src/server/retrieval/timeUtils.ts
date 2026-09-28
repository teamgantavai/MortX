import { StructuredTimeRange } from '../ai/types';
import { DateRange } from './types';

/**
 * Resolves a high-level StructuredTimeRange into concrete start and end dates.
 * Keeps date-resolution logic independent from the AI prompt and model.
 *
 * Now supports event-specific ranges: TOMORROW, THIS_WEEKEND, NEXT_WEEK.
 */
export function resolveTimeRange(
  timeRange?: StructuredTimeRange | null,
  referenceDate: Date = new Date()
): DateRange {
  if (!timeRange || !timeRange.type || timeRange.type === 'NO_TIME_FILTER') {
    return {};
  }

  const now = new Date(referenceDate);

  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  switch (timeRange.type) {
    case 'TODAY': {
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
    }

    case 'TOMORROW': {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return {
        startDate: startOfDay(tomorrow),
        endDate: endOfDay(tomorrow),
      };
    }

    case 'YESTERDAY': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    }

    case 'THIS_WEEK': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return {
        startDate: startOfDay(sevenDaysAgo),
        endDate: endOfDay(now),
      };
    }

    case 'THIS_WEEKEND': {
      // Find the coming Saturday and Sunday from referenceDate
      const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
      const daysToSat = dayOfWeek <= 6 ? (6 - dayOfWeek) % 7 || 7 : 1;
      // If today is Saturday (6) or Sunday (0), we consider it "this weekend"
      let satStart: Date;
      let sunEnd: Date;

      if (dayOfWeek === 6) {
        // Today is Saturday
        satStart = startOfDay(now);
        const sun = new Date(now);
        sun.setDate(now.getDate() + 1);
        sunEnd = endOfDay(sun);
      } else if (dayOfWeek === 0) {
        // Today is Sunday
        const sat = new Date(now);
        sat.setDate(now.getDate() - 1);
        satStart = startOfDay(sat);
        sunEnd = endOfDay(now);
      } else {
        // Weekday: go to upcoming Saturday
        satStart = new Date(now);
        satStart.setDate(now.getDate() + daysToSat);
        satStart = startOfDay(satStart);
        sunEnd = new Date(satStart);
        sunEnd.setDate(satStart.getDate() + 1);
        sunEnd = endOfDay(sunEnd);
      }
      return { startDate: satStart, endDate: sunEnd };
    }

    case 'NEXT_WEEK': {
      // Monday to Sunday of the next calendar week
      const dayOfWeek2 = now.getDay();
      const daysToMonday = dayOfWeek2 === 0 ? 1 : 8 - dayOfWeek2;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysToMonday);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      return {
        startDate: startOfDay(nextMonday),
        endDate: endOfDay(nextSunday),
      };
    }

    case 'THIS_MONTH': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return {
        startDate: startOfDay(thirtyDaysAgo),
        endDate: endOfDay(now),
      };
    }

    case 'RECENT': {
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(now.getDate() - 2);
      return {
        startDate: twoDaysAgo,
        endDate: now,
      };
    }

    default:
      return {};
  }
}

import { getDayFromDate } from './getDayFromDate';
import { filterEventByPatterns } from './filterEventByPatterns';

import type { CalendarEvent } from './calendarEvents';
import type { TrashCardConfig } from '../cards/trash-card/trash-card-config';

interface Config {
  pattern: Required<TrashCardConfig>['pattern'];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  filter_events: TrashCardConfig['filter_events'];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  only_all_day_events: TrashCardConfig['only_all_day_events'];
}

interface Options {
  config: Config;
  location?: string;
  now: Date;
}

const isMatchingAnyPatterns = (item: CalendarEvent, config: Config) => {
  if (!config.filter_events) {
    return true;
  }

  const trashTypes = config.pattern.filter(pat => pat.type !== 'others');
  const patterns = trashTypes.filter(pattern => pattern.pattern !== undefined);

  return patterns.length === 0 || patterns.some(pat => filterEventByPatterns(pat, item));
};

const getPatternKey = (event: CalendarEvent, config: Config): string => {
  const matched = config.pattern.
    map((pat, idx) => ({ ...pat, idx })).
    find(pat => pat.type !== 'others' && filterEventByPatterns(pat, event));

  if (matched) {
    return matched.type === 'custom' ? `custom-${matched.idx}` : matched.type;
  }

  return `others:${event.content.recurrence_id ?? event.content.summary}`;
};

/**
 * Find the most recent past event per pattern/type.
 */
const findLastPastEvents = (items: CalendarEvent[], { config, now, location }: Options): CalendarEvent[] => {
  const pastCandidates = items.
    filter(item => {
      if (location && !item.content.location?.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }

      if (config.only_all_day_events && !item.isWholeDayEvent) {
        return false;
      }

      if (!isMatchingAnyPatterns(item, config)) {
        return false;
      }

      // Already ended (whole-day: end is exclusive next-day midnight in HA)
      if (item.isWholeDayEvent) {
        return item.date.end <= now && getDayFromDate(item.date.start) !== getDayFromDate(now);
      }

      return item.date.end < now;
    }).
    sort((a, b) => b.date.start.getTime() - a.date.start.getTime());

  const seen = new Set<string>();
  const result: CalendarEvent[] = [];

  for (const event of pastCandidates) {
    const key = getPatternKey(event, config);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(event);
  }

  return result.sort((a, b) => a.date.start.getTime() - b.date.start.getTime());
};

export {
  findLastPastEvents
};

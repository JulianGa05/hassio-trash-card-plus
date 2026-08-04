import { eventsToItems } from './eventsToItems';
import { findActiveEvents } from './findActiveEvents';
import { findLastPastEvents } from './findLastPastEvents';
import { normaliseEvents } from './normaliseEvents';
import { filterDuplicatedItems } from './filterDuplicatedItems';
import { sortItems } from './sortItems';

import type { Debugger } from './debugger';
import type { HomeAssistant } from './ha';
import type { RawCalendarEvent } from './calendarEvents';
import type { TrashCardConfig } from '../cards/trash-card/trash-card-config';
import type { CalendarItem } from './calendarItem';

const fetchData = async (
  hass: HomeAssistant,
  calendar: string,
  { start, end }: { start: string; end: string }
) => {
  const uri = `calendars/${calendar}?start=${start}&end=${end}`;

  return await hass.callApi<RawCalendarEvent[]>('GET', uri).
    then(data => data.map(item => ({
      ...item,
      entity: calendar
    })));
};

const getCalendarData = async (
  hass: HomeAssistant,
  calendars: string[],
  { start, end, dropAfter }: { start: string; end: string; dropAfter: boolean },
  debuggerInstance: Debugger,
  config: TrashCardConfig,
  timezoneOffset: string
) => {
  const rawCalendarEvents: RawCalendarEvent[] = [];

  for await (const calendar of calendars) {
    rawCalendarEvents.push(...await fetchData(hass, calendar, { start, end }));
  }

  debuggerInstance.reset();
  debuggerInstance.log(`timezone`, timezoneOffset);
  debuggerInstance.log(`calendar data`, rawCalendarEvents);

  const normalisedEvents = normaliseEvents(rawCalendarEvents);

  normalisedEvents.sort((evtA, evtB) => evtA.date.start.getTime() - evtB.date.start.getTime());

  const now = new Date();

  debuggerInstance.log(`normaliseEvents`, normalisedEvents);
  debuggerInstance.log(`dropAfter`, dropAfter);
  debuggerInstance.log(`now`, now);

  if (config.location) {
    debuggerInstance.log(`location filtering`, config.location);
  }

  const filterConfig = {
    pattern: config.pattern!,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    filter_events: config.filter_events,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    only_all_day_events: config.only_all_day_events
  };

  const activeEvents = findActiveEvents(normalisedEvents, {
    config: filterConfig,
    dropAfter,
    now,
    location: config.location,
    filterFutureEventsDay: end
  });

  debuggerInstance.log(`activeElements`, activeEvents);

  const upcomingItems = eventsToItems(activeEvents, {
    pattern: config.pattern!,
    useSummary: Boolean(config.use_summary)
  });

  debuggerInstance.log(`eventsToItems`, upcomingItems);

  const eventsPerPattern = config.events_per_pattern ??
    (config.event_grouping === false ? 0 : 1);

  let items: CalendarItem[] = filterDuplicatedItems(upcomingItems, eventsPerPattern);

  if (config.include_last_past) {
    const pastEvents = findLastPastEvents(normalisedEvents, {
      config: filterConfig,
      now,
      location: config.location
    });

    debuggerInstance.log(`lastPastEvents`, pastEvents);

    const pastItems = eventsToItems(pastEvents, {
      pattern: config.pattern!,
      useSummary: Boolean(config.use_summary)
    }).map(item => ({
      ...item,
      isPast: true
    }));

    // Avoid duplicating an event that is already in the upcoming list
    const upcomingKeys = new Set(
      items.map(item => `${item.type}|${item.date.start.toISOString()}|${item.content.summary}`)
    );

    const uniquePast = pastItems.filter(
      item => !upcomingKeys.has(`${item.type}|${item.date.start.toISOString()}|${item.content.summary}`)
    );

    items = [ ...uniquePast, ...items ];
  }

  return sortItems(items, config.sort_by ?? 'date', config.pattern);
};

export {
  getCalendarData
};

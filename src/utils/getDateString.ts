import setupCustomlocalize from '../localize';
import { getDayFromDate } from './getDayFromDate';
import { daysTill } from './daysTill';
import { DateTime } from 'luxon';

import type { TrashCardConfig } from '../cards/trash-card/trash-card-config';
import type { HomeAssistant } from './ha';
import type { CalendarItem } from './calendarItem';

type CustomLocalize = ReturnType<typeof setupCustomlocalize>;

interface DateParts {
  /** Text for the left/secondary date line (without counter when split). */
  dateLabel: string;
  /** Full combined string (chips / legacy). */
  fullLabel: string;
  /** Day offset from today (negative = past). */
  days: number;
  /** Whether day_style wants a separate counter badge. */
  splitCounter: boolean;
  /** Inline counter text, e.g. "vor 13" / "in 7 Tagen". */
  counterText: string;
}

const format = (date: Date, dateStyleFormat: string, language: string) =>
  DateTime.fromJSDate(date).setLocale(language).toFormat(dateStyleFormat);

const getTimeString = (customLocalize: CustomLocalize, offset: string, day?: string, startTime?: string, endTime?: string, excludeTime?: boolean, short?: boolean) => {
  if (offset === 'today' || offset === 'tomorrow') {
    const key = `card.trash.${offset}${startTime && !excludeTime ? '_from_till' : ''}${startTime && !excludeTime && short ? '_short' : ''}`;

    return `${customLocalize(`${key}`).replace('<START>', startTime ?? '').replace('<END>', endTime ?? '')}`;
  }

  const key = `card.trash.day${startTime && !excludeTime ? '_from_till' : ''}${startTime && !excludeTime && short ? '_short' : ''}`;

  return customLocalize(`${key}`).replace('<DAY>', day).replace('<START>', startTime ?? '').replace('<END>', endTime ?? '');
};

const getCounterString = (
  item: CalendarItem,
  customLocalize: CustomLocalize,
  startTime?: string,
  endTime?: string,
  excludeTime?: boolean
): string => {
  const daysToStart = daysTill(new Date(), item.date.start);

  if (daysToStart < 0) {
    const daysAgo = Math.abs(daysToStart);

    return `${customLocalize(`card.trash.daysago${daysAgo > 1 ? '_more' : ''}`).replace('<DAYS>', `${daysAgo}`)}`;
  }

  if (daysToStart > 0) {
    const daysLeft = daysToStart;

    return `${customLocalize(`card.trash.daysleft${daysLeft > 1 ? '_more' : ''}${startTime && !excludeTime ? '_from_till' : ''}`).replace('<DAYS>', `${daysLeft}`).replace('<START>', startTime ?? '').replace('<END>', endTime ?? '')}`;
  }

  const daysToEnd = daysTill(new Date(), item.date.end);

  if (daysToEnd < 0) {
    const daysAgo = Math.abs(daysToEnd);

    return `${customLocalize(`card.trash.daysago${daysAgo > 1 ? '_more' : ''}`).replace('<DAYS>', `${daysAgo}`)}`;
  }

  return `${customLocalize(`card.trash.daysleftend${daysToEnd > 1 ? '_more' : ''}${startTime && !excludeTime ? '_till' : ''}`).replace('<DAYS>', `${daysToEnd}`).replace('<END>', endTime ?? '')}`;
};

const getFormattedDate = (
  item: CalendarItem,
  dayStyle: TrashCardConfig['day_style'],
  dayStyleFormat: TrashCardConfig['day_style_format'],
  language: string,
  compact = false
): string => {
  if (dayStyle === 'weekday' || dayStyle === 'weekday_and_counter') {
    return item.date.start.toLocaleDateString(language, {
      weekday: 'long'
    });
  }

  if (dayStyle === 'custom') {
    return format(item.date.start, dayStyleFormat ?? 'dd.mm.YYYY', language);
  }

  return item.date.start.toLocaleDateString(language, {
    year: 'numeric',
    month: compact ? 'short' : 'long',
    day: 'numeric'
  });
};

const combineDateAndCounter = (datePart: string, counterPart: string): string =>
  `${datePart} · ${counterPart}`;

const getBadgeText = (days: number, customLocalize: CustomLocalize): string => {
  if (days === 0) {
    return customLocalize('card.trash.today');
  }

  if (days === 1) {
    return customLocalize('card.trash.tomorrow');
  }

  if (days === -1) {
    return customLocalize('card.trash.badge_ago_one');
  }

  if (days < 0) {
    return customLocalize('card.trash.badge_ago').replace('<DAYS>', `${Math.abs(days)}`);
  }

  return customLocalize('card.trash.badge_in').replace('<DAYS>', `${days}`);
};

const getDateParts = (
  item: CalendarItem,
  excludeTime?: boolean,
  dayStyle?: TrashCardConfig['day_style'],
  dayStyleFormat?: TrashCardConfig['day_style_format'],
  hass?: HomeAssistant,
  compact = false
): DateParts => {
  const empty: DateParts = {
    dateLabel: '',
    fullLabel: '',
    days: 0,
    splitCounter: false,
    counterText: ''
  };

  if (!hass) {
    return empty;
  }

  const customLocalize = setupCustomlocalize(hass);
  const days = daysTill(new Date(), item.date.start);
  const counterText = getBadgeText(days, customLocalize);

  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayDay = getDayFromDate(today);
  const tomorrowDay = getDayFromDate(tomorrow);
  const stateDay = getDayFromDate(item.date.start);

  const startTime = !item.isWholeDayEvent ?
    item.date.start.toLocaleTimeString(hass.language, {
      hour: 'numeric',
      minute: 'numeric'
    }) :
    undefined;

  const endTime = !item.isWholeDayEvent ?
    item.date.end.toLocaleTimeString(hass.language, {
      hour: 'numeric',
      minute: 'numeric'
    }) :
    undefined;

  const isCombined = dayStyle === 'date_and_counter' || dayStyle === 'weekday_and_counter';
  const isTodayOrTomorrow = stateDay === todayDay || stateDay === tomorrowDay;

  if (isTodayOrTomorrow && days >= 0) {
    const base = getTimeString(
      customLocalize,
      stateDay === todayDay ? 'today' : 'tomorrow',
      undefined,
      startTime,
      endTime,
      excludeTime,
      false
    );

    // Today: keep a single "Heute" label (no duplicate badge).
    // Tomorrow+: date/label left, large counter badge right.
    if (isCombined && stateDay === tomorrowDay) {
      return {
        dateLabel: base,
        fullLabel: combineDateAndCounter(base, getCounterString(item, customLocalize, undefined, undefined, true)),
        days,
        splitCounter: true,
        counterText
      };
    }

    return {
      dateLabel: base,
      fullLabel: base,
      days,
      splitCounter: false,
      counterText
    };
  }

  if (dayStyle === 'counter') {
    const counter = getCounterString(item, customLocalize, startTime, endTime, excludeTime);

    return {
      dateLabel: counter,
      fullLabel: counter,
      days,
      splitCounter: false,
      counterText
    };
  }

  const day = getFormattedDate(item, dayStyle, dayStyleFormat, hass.language, compact);
  const datePart = getTimeString(customLocalize, 'day', day, startTime, endTime, excludeTime, false);

  if (isCombined) {
    const counter = getCounterString(item, customLocalize, undefined, undefined, true);

    return {
      dateLabel: datePart,
      fullLabel: combineDateAndCounter(datePart, counter),
      days,
      splitCounter: true,
      counterText
    };
  }

  return {
    dateLabel: datePart,
    fullLabel: datePart,
    days,
    splitCounter: false,
    counterText
  };
};

const getDateString = (
  item: CalendarItem,
  excludeTime?: boolean,
  dayStyle?: TrashCardConfig['day_style'],
  dayStyleFormat?: TrashCardConfig['day_style_format'],
  hass?: HomeAssistant
): string => getDateParts(item, excludeTime, dayStyle, dayStyleFormat, hass).fullLabel;

export {
  getDateString,
  getDateParts
};

export type {
  DateParts
};

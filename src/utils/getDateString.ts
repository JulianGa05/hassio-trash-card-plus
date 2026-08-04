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
  /** Inline counter text, e.g. "vor 13 Tagen" / "in 7 Tagen". */
  counterText: string;
  /** Prefix for stacked counter ("in" / "vor"), empty for today/tomorrow. */
  counterPrefix: string;
  /** Rest line for stacked counter ("12 Tagen"), or full label when no prefix. */
  counterRest: string;
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

const getStackedCounterParts = (
  days: number,
  customLocalize: CustomLocalize
): { prefix: string; rest: string; full: string } => {
  if (days === 0 || days === 1) {
    const label = getBadgeText(days, customLocalize);

    return { prefix: '', rest: label, full: label };
  }

  if (days < 0) {
    const amount = Math.abs(days);
    const prefix = customLocalize('card.trash.counter_prefix_ago');
    const full = getBadgeText(days, customLocalize);

    // Languages without a leading "ago"/"vor" keep a single-line past label.
    if (!prefix) {
      return { prefix: '', rest: full, full };
    }

    const rest = customLocalize(`card.trash.counter_amount${amount === 1 ? '' : '_more'}`).
      replace('<DAYS>', `${amount}`);

    return { prefix, rest, full };
  }

  const prefix = customLocalize('card.trash.counter_prefix_in');
  const rest = customLocalize(`card.trash.counter_amount${days === 1 ? '' : '_more'}`).
    replace('<DAYS>', `${days}`);

  return {
    prefix,
    rest,
    full: getBadgeText(days, customLocalize)
  };
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
    counterText: '',
    counterPrefix: '',
    counterRest: ''
  };

  if (!hass) {
    return empty;
  }

  const customLocalize = setupCustomlocalize(hass);
  const days = daysTill(new Date(), item.date.start);
  const stacked = getStackedCounterParts(days, customLocalize);
  // Prefer full phrases ("in 15 Tagen") for readability; keep short labels for today/tomorrow.
  const counterText = days === 0 || days === 1 ?
    stacked.full :
    getCounterString(item, customLocalize, undefined, undefined, true);
  const counterFields = {
    counterText,
    counterPrefix: stacked.prefix,
    counterRest: stacked.rest || counterText
  };

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
    const day = getFormattedDate(item, dayStyle, dayStyleFormat, hass.language, compact);
    const datePart = getTimeString(customLocalize, 'day', day, startTime, endTime, excludeTime, false);
    const base = getTimeString(
      customLocalize,
      stateDay === todayDay ? 'today' : 'tomorrow',
      undefined,
      startTime,
      endTime,
      excludeTime,
      false
    );

    // Combined: calendar date left, "Heute"/"Morgen" (or day-count) as the right counter.
    if (isCombined) {
      return {
        dateLabel: datePart,
        fullLabel: combineDateAndCounter(datePart, base),
        days,
        splitCounter: true,
        ...counterFields
      };
    }

    return {
      dateLabel: base,
      fullLabel: base,
      days,
      splitCounter: false,
      ...counterFields
    };
  }

  if (dayStyle === 'counter') {
    const counter = getCounterString(item, customLocalize, startTime, endTime, excludeTime);

    return {
      dateLabel: counter,
      fullLabel: counter,
      days,
      splitCounter: false,
      ...counterFields
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
      ...counterFields
    };
  }

  return {
    dateLabel: datePart,
    fullLabel: datePart,
    days,
    splitCounter: false,
    ...counterFields
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

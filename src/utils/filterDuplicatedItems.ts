import type { CalendarItem } from './calendarItem';

const getItemKey = (item: CalendarItem): string => {
  if (item.type === 'others') {
    const { content } = item;

    return `others:${content.recurrence_id ?? content.summary}`;
  }

  return item.type;
};

/**
 * Keep up to `limit` upcoming items per pattern/type.
 * Items are expected to already be sorted by start date ascending.
 * A limit of 0 or less means "no limit" (return all items).
 */
const filterDuplicatedItems = (items: CalendarItem[], limit = 1): CalendarItem[] => {
  if (limit <= 0) {
    return items;
  }

  const counts = new Map<string, number>();

  return items.filter(item => {
    const key = getItemKey(item);
    const count = counts.get(key) ?? 0;

    if (count >= limit) {
      return false;
    }

    counts.set(key, count + 1);

    return true;
  });
};

export {
  filterDuplicatedItems,
  getItemKey
};

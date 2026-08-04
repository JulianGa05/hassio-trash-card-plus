import { getItemKey } from './filterDuplicatedItems';

import type { CalendarItem } from './calendarItem';
import type { TrashCardConfig } from '../cards/trash-card/trash-card-config';

type SortBy = NonNullable<TrashCardConfig['sort_by']>;

/**
 * Sort items by date (default) or group by pattern order from config.
 * Pattern sort keeps chronological order within each pattern.
 */
const sortItems = (
  items: CalendarItem[],
  sortBy: SortBy = 'date',
  pattern: TrashCardConfig['pattern'] = []
): CalendarItem[] => {
  if (sortBy !== 'pattern') {
    return [ ...items ].sort((a, b) => a.date.start.getTime() - b.date.start.getTime());
  }

  const patternOrder = new Map<string, number>();

  pattern.forEach((pat, idx) => {
    const key = pat.type === 'custom' ? `custom-${idx}` : pat.type;

    if (!patternOrder.has(key)) {
      patternOrder.set(key, idx);
    }
  });

  const orderOf = (item: CalendarItem): number => {
    if (item.type === 'others') {
      return patternOrder.get('others') ?? 999;
    }

    return patternOrder.get(item.type) ?? 999;
  };

  return [ ...items ].sort((a, b) => {
    const orderA = orderOf(a);
    const orderB = orderOf(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.date.start.getTime() - b.date.start.getTime();
  });
};

/**
 * Group items into columns by pattern (config order), for grid layout.
 */
const groupItemsByPattern = (
  items: CalendarItem[],
  pattern: TrashCardConfig['pattern'] = []
): { key: string; items: CalendarItem[] }[] => {
  const sorted = sortItems(items, 'pattern', pattern);
  const groups: { key: string; items: CalendarItem[] }[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of sorted) {
    const key = item.type === 'others' ? getItemKey(item) : item.type;
    const existing = indexByKey.get(key);

    if (existing === undefined) {
      indexByKey.set(key, groups.length);
      groups.push({ key, items: [ item ] });
    } else {
      groups[existing].items.push(item);
    }
  }

  return groups;
};

export {
  sortItems,
  groupItemsByPattern
};

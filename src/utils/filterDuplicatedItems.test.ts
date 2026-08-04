import { filterDuplicatedItems } from './filterDuplicatedItems';

import type { CalendarItem } from './calendarItem';

const makeItem = (type: string, summary: string, start: string): CalendarItem =>
  ({
    type,
    label: summary,
    icon: 'mdi:trash-can',
    color: 'grey',
    date: {
      start: new Date(start),
      end: new Date(start)
    },
    isWholeDayEvent: true,
    content: {
      summary,
      description: null,
      location: null,
      uid: null,
      recurrence_id: null,
      rrule: null,
      entity: 'calendar.test'
    }
  }) as CalendarItem;

describe(`filterDuplicatedItems`, () => {
  const items = [
    makeItem('waste', 'Rest 1', '2024-04-01'),
    makeItem('organic', 'Bio 1', '2024-04-02'),
    makeItem('waste', 'Rest 2', '2024-04-08'),
    makeItem('organic', 'Bio 2', '2024-04-09'),
    makeItem('waste', 'Rest 3', '2024-04-15')
  ];

  test(`keeps one item per type by default`, () => {
    const result = filterDuplicatedItems(items);

    expect(result.map(i => i.content.summary)).toEqual([ 'Rest 1', 'Bio 1' ]);
  });

  test(`keeps N items per type`, () => {
    const result = filterDuplicatedItems(items, 2);

    expect(result.map(i => i.content.summary)).toEqual([ 'Rest 1', 'Bio 1', 'Rest 2', 'Bio 2' ]);
  });

  test(`limit 0 returns all items`, () => {
    const result = filterDuplicatedItems(items, 0);

    expect(result).toHaveLength(items.length);
  });
});

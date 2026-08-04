import { groupItemsByPattern, sortItems } from './sortItems';

import type { CalendarItem } from './calendarItem';

const makeItem = (type: CalendarItem['type'], summary: string, start: string): CalendarItem =>
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

describe(`sortItems`, () => {
  const pattern = [
    { type: 'paper', icon: 'mdi:newspaper', color: 'blue' },
    { type: 'waste', icon: 'mdi:trash-can', color: 'grey' },
    { type: 'recycle', icon: 'mdi:recycle', color: 'amber' }
  ];

  const items = [
    makeItem('waste', 'Rest 1', '2024-04-08'),
    makeItem('paper', 'Paper 1', '2024-04-02'),
    makeItem('recycle', 'Yellow 1', '2024-04-03'),
    makeItem('paper', 'Paper 2', '2024-04-16')
  ];

  test(`sorts by date by default`, () => {
    const result = sortItems(items, 'date', pattern);

    expect(result.map(i => i.content.summary)).toEqual([
      'Paper 1',
      'Yellow 1',
      'Rest 1',
      'Paper 2'
    ]);
  });

  test(`groups by pattern order`, () => {
    const result = sortItems(items, 'pattern', pattern);

    expect(result.map(i => i.content.summary)).toEqual([
      'Paper 1',
      'Paper 2',
      'Rest 1',
      'Yellow 1'
    ]);
  });

  test(`groupItemsByPattern builds columns`, () => {
    const groups = groupItemsByPattern(items, pattern);

    expect(groups.map(g => g.key)).toEqual([ 'paper', 'waste', 'recycle' ]);
    expect(groups[0].items.map(i => i.content.summary)).toEqual([ 'Paper 1', 'Paper 2' ]);
  });
});

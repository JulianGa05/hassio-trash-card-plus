import { array, assign, boolean, integer, literal, object, optional, string, union } from 'superstruct';
import { defaultConfigStruct } from '../../utils/form/defaultConfigStruct';

import type { ItemSettings } from '../../utils/itemSettings';

const LAYOUTS = [
  'default',
  'horizontal',
  'vertical'
] as const;

const LAYOUT_ICONS: Record<typeof LAYOUTS[number], string> = {
  default: 'mdi:card-text-outline',
  vertical: 'mdi:focus-field-vertical',
  horizontal: 'mdi:focus-field-horizontal'
};

const DAYSTYLES = [
  'default',
  'counter',
  'weekday',
  'custom',
  'date_and_counter',
  'weekday_and_counter'
] as const;

const CARDSTYLES = [
  'card',
  'chip',
  'icon'
] as const;

const ALIGNMENTSTYLES = [
  'left',
  'center',
  'right',
  'space'
] as const;

const COLORMODES = [
  'background',
  'icon'
] as const;

const SORTMODES = [
  'date',
  'pattern',
  'pattern_grid'
] as const;

const INFOLAYOUTS = [
  'standard',
  'compact'
] as const;

interface TrashCardConfig {
  entities?: string[];
  pattern?: ItemSettings[];
  location?: string;
  next_days?: number;
  /** How many days to look into the past when `include_last_past` is enabled. */
  past_days?: number;
  items_per_row?: number;
  filter_events?: boolean;
  full_size?: boolean;
  drop_todayevents_from?: string;
  use_summary?: boolean;
  hide_time_range?: boolean;
  /**
   * @deprecated Use `events_per_pattern` instead.
   * Kept for backwards compatibility: true → 1, false → 0 (all).
   */
  event_grouping?: boolean;
  /**
   * How many upcoming events to show per pattern/type.
   * `0` = show all events in range (no per-pattern limit).
   * Default: `1` (same as former `event_grouping: true`).
   */
  events_per_pattern?: number;
  /** Also show the most recent past collection per pattern. */
  include_last_past?: boolean;
  /** Sort/layout: chronological, grouped columns, or pattern-ordered grid. */
  sort_by?: typeof SORTMODES[number];
  /** Use a denser presentation on narrow screens. */
  mobile_compact?: boolean;
  /** Card information arrangement on non-mobile screens. */
  info_layout?: typeof INFOLAYOUTS[number];
  /** Stack counter as "in"/"vor" above the day count (narrower). */
  counter_stacked?: boolean;
  /** Font size for the trash label, percent of default (100). */
  label_font_size?: number;
  /** Font size for the date line, percent of default (100). */
  date_font_size?: number;
  /** Font size for the days-until counter, percent of default (100). */
  counter_font_size?: number;
  day_style?: typeof DAYSTYLES[number];
  day_style_format?: string;
  card_style?: typeof CARDSTYLES[number];
  alignment_style?: typeof ALIGNMENTSTYLES[number];
  color_mode?: typeof COLORMODES[number] | 'badge';
  refresh_rate?: number;
  icon_size?: number;
  debug?: boolean;
  with_label?: boolean;
  index?: number;
  view_index?: number;
  view_layout?: any;
  layout: any;
  type: string;
  only_all_day_events?: boolean;
}

 type CardStyleConfig = Pick<TrashCardConfig, 'hide_time_range' | 'day_style' | 'day_style_format' | 'layout' | 'color_mode' | 'icon_size' | 'with_label'>;

const entityCardConfigStruct = assign(
  defaultConfigStruct,
  object({
    entities: optional(array(string())),
    name: optional(string()),
    location: optional(string()),
    layout: optional(union([ literal(LAYOUTS[0]), literal(LAYOUTS[1]), literal(LAYOUTS[2]) ])),
    fill_container: optional(boolean()),
    filter_events: optional(boolean()),
    full_size: optional(boolean()),
    use_summary: optional(boolean()),
    hide_time_range: optional(boolean()),
    next_days: optional(integer()),
    past_days: optional(integer()),
    items_per_row: optional(integer()),
    refresh_rate: optional(integer()),
    drop_todayevents_from: optional(string()),
    event_grouping: optional(boolean()),
    events_per_pattern: optional(integer()),
    include_last_past: optional(boolean()),
    sort_by: optional(union([
      literal(SORTMODES[0]),
      literal(SORTMODES[1]),
      literal(SORTMODES[2])
    ])),
    mobile_compact: optional(boolean()),
    info_layout: optional(union([
      literal(INFOLAYOUTS[0]),
      literal(INFOLAYOUTS[1])
    ])),
    counter_stacked: optional(boolean()),
    label_font_size: optional(integer()),
    date_font_size: optional(integer()),
    counter_font_size: optional(integer()),
    day_style: optional(union([
      literal(DAYSTYLES[0]),
      literal(DAYSTYLES[1]),
      literal(DAYSTYLES[2]),
      literal(DAYSTYLES[3]),
      literal(DAYSTYLES[4]),
      literal(DAYSTYLES[5])
    ])),
    day_style_format: optional(string()),
    card_style: optional(union([ literal(CARDSTYLES[0]), literal(CARDSTYLES[1]), literal(CARDSTYLES[2]) ])),
    alignment_style: optional(union([ literal(ALIGNMENTSTYLES[0]), literal(ALIGNMENTSTYLES[1]), literal(ALIGNMENTSTYLES[2]), literal(ALIGNMENTSTYLES[3]) ])),
    color_mode: optional(union([ literal(COLORMODES[0]), literal(COLORMODES[1]) ])),
    debug: optional(boolean()),
    icon_size: optional(integer()),
    with_label: optional(boolean()),
    only_all_day_events: optional(boolean()),
    pattern: optional(array(
      object({
        color: optional(string()),
        icon: optional(string()),
        label: optional(string()),
        pattern: optional(string()),
        pattern_exact: optional(boolean()),
        picture: optional(string()),
        type: string()
      })
    ))
  })
);

export {
  entityCardConfigStruct,
  DAYSTYLES,
  COLORMODES,
  CARDSTYLES,
  ALIGNMENTSTYLES,
  LAYOUTS,
  LAYOUT_ICONS,
  SORTMODES,
  INFOLAYOUTS
};

export type {
  TrashCardConfig,
  CardStyleConfig
};


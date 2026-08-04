import { LitElement, css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import { TRASH_CARD_NAME } from '../const';
import { groupItemsByPattern } from '../../../utils/sortItems';
import { daysTill } from '../../../utils/daysTill';
import setupCustomlocalize from '../../../localize';

import '../items/card';

import type { BaseContainerElement } from './BaseContainerElement';
import type { TrashCardConfig } from '../trash-card-config';
import type { CalendarItem } from '../../../utils/calendarItem';
import type { HomeAssistant } from '../../../utils/ha';

const isPastItem = (item: CalendarItem): boolean =>
  Boolean(item.isPast) || daysTill(new Date(), item.date.start) < 0;

@customElement(`${TRASH_CARD_NAME}-cards-container`)
class Cards extends LitElement implements BaseContainerElement {
  @state() private items?: CalendarItem[];

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config?: TrashCardConfig;

  public setConfig (config?: TrashCardConfig) {
    this.config = config;
  }

  public setItems (items?: CalendarItem[]) {
    this.items = items;
  }

  public setHass (hass?: HomeAssistant) {
    this.hass = hass;
  }

  private renderCard (item: CalendarItem, key: string) {
    return html`
      <trash-card-item-card
        key=${key}
        .item=${item}
        .config=${this.config}
        .hass=${this.hass}
      ></trash-card-item-card>
    `;
  }

  private renderDivider (label: string) {
    return html`
      <div class="timeline-divider" role="separator">
        <span class="timeline-line"></span>
        <span class="timeline-label">${label}</span>
        <span class="timeline-line"></span>
      </div>
    `;
  }

  private isCompactLayoutActive (): boolean {
    if (!this.config) {
      return false;
    }

    if (this.config.info_layout === 'compact') {
      return true;
    }

    return Boolean(this.config.mobile_compact) && window.matchMedia('(max-width: 600px)').matches;
  }

  /** Compact needs readable text — never more than two columns. */
  private resolveColumns (desired: number): number {
    const capped = Math.max(1, desired);

    return this.isCompactLayoutActive() ? Math.min(capped, 2) : capped;
  }

  private gridStyle (columns: number) {
    const resolved = this.resolveColumns(columns);

    return styleMap({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'grid-template-columns': `repeat(${resolved}, minmax(0, 1fr))`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '--mobile-columns': `${Math.min(resolved, 2)}`
    });
  }

  private renderItemGrid (items: CalendarItem[], columns: number) {
    return html`
      <div style=${this.gridStyle(columns)} class="card-container ${this.isCompactLayoutActive() ? 'compact-grid' : ''}">
        ${items.map((item, idx) => this.renderCard(item, `card-${idx}-${item.content.uid ?? item.content.summary}`))}
      </div>
    `;
  }

  private renderPatternGrid (
    groups: { key: string; items: CalendarItem[] }[],
    columns: number,
    keyPrefix: string
  ) {
    // Skip completely empty groups only when they would create blank trailing columns
    // Keep alignment: same group keys/order for past & future sections
    const compact = this.isCompactLayoutActive();
    const resolved = this.resolveColumns(columns);
    // In compact mode flatten pattern columns into a simple 2-col grid (no empty pattern slots)
    const flatItems = compact ?
      groups.flatMap(group => group.items) :
      undefined;

    if (flatItems) {
      return this.renderItemGrid(flatItems, resolved);
    }

    return html`
      <div style=${this.gridStyle(columns)} class="card-container pattern-grid">
        ${groups.map(group => html`
          <div class="pattern-column">
            ${group.items.map((item, idx) =>
    this.renderCard(item, `${keyPrefix}-${group.key}-${idx}-${item.content.uid ?? item.content.summary}`))}
          </div>
        `)}
      </div>
    `;
  }

  public render () {
    if (!this.config || !this.hass) {
      return nothing;
    }

    if (!this.items || this.items.length === 0) {
      return html`<trash-card-item-empty .config=${this.config} .hass=${this.hass}/>`;
    }

    const customLocalize = setupCustomlocalize(this.hass);
    const sortBy = this.config.sort_by ?? 'date';
    const sortByPattern = sortBy === 'pattern';
    const pastItems = this.items.filter(isPastItem);
    const futureItems = this.items.filter(item => !isPastItem(item));
    const hasBoth = pastItems.length > 0 && futureItems.length > 0;

    if (sortByPattern) {
      const allGroups = groupItemsByPattern(this.items, this.config.pattern);
      // Pattern mode: default to one column per pattern (unless user set columns explicitly > 1)
      const configured = this.config.items_per_row;
      const columns = this.resolveColumns(Math.min(
        allGroups.length,
        Math.max(1, configured && configured > 1 ? configured : allGroups.length)
      ));

      const pastGroups = allGroups.map(group => ({
        key: group.key,
        items: group.items.filter(isPastItem)
      }));
      const futureGroups = allGroups.map(group => ({
        key: group.key,
        items: group.items.filter(item => !isPastItem(item))
      }));

      const hasPast = pastGroups.some(g => g.items.length > 0);
      const hasFuture = futureGroups.some(g => g.items.length > 0);

      return html`
        <div class="sections">
          ${hasPast ? html`
            ${hasBoth ? this.renderDivider(customLocalize('card.trash.section_past')) : nothing}
            ${this.renderPatternGrid(pastGroups, columns, 'past')}
          ` : nothing}
          ${hasPast && hasFuture ? this.renderDivider(customLocalize('card.trash.section_upcoming')) : nothing}
          ${hasFuture ? this.renderPatternGrid(futureGroups, columns, 'future') : nothing}
        </div>
      `;
    }

    const itemsPerRow = this.config.items_per_row ?? 1;
    const gridPastItems = sortBy === 'pattern_grid' ?
      groupItemsByPattern(pastItems, this.config.pattern).flatMap(group => group.items) :
      pastItems;
    const gridFutureItems = sortBy === 'pattern_grid' ?
      groupItemsByPattern(futureItems, this.config.pattern).flatMap(group => group.items) :
      futureItems;

    return html`
      <div class="sections">
        ${pastItems.length > 0 ? html`
          ${hasBoth ? this.renderDivider(customLocalize('card.trash.section_past')) : nothing}
          ${this.renderItemGrid(gridPastItems, itemsPerRow)}
        ` : nothing}
        ${hasBoth ? this.renderDivider(customLocalize('card.trash.section_upcoming')) : nothing}
        ${futureItems.length > 0 ? this.renderItemGrid(gridFutureItems, itemsPerRow) : nothing}
      </div>
    `;
  }

  public static get styles () {
    return [
      css`
        .sections {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .card-container {
          display: grid;
          gap: var(--ha-section-grid-column-gap, 8px);
          width: 100%;
        }
        .pattern-grid {
          align-items: start;
        }
        .pattern-column {
          display: flex;
          flex-direction: column;
          gap: var(--ha-section-grid-column-gap, 8px);
          min-width: 0;
          width: 100%;
        }
        trash-card-item-card {
          display: block;
          width: 100%;
          min-width: 0;
          max-width: 100%;
        }
        .timeline-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 4px 0 2px;
        }
        .timeline-line {
          flex: 1 1 auto;
          height: 1px;
          background: var(--divider-color, rgba(127, 127, 127, 0.45));
        }
        .timeline-label {
          flex: 0 0 auto;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.7;
          white-space: nowrap;
        }
        @media (max-width: 600px) {
          .card-container {
            grid-template-columns: repeat(var(--mobile-columns), minmax(0, 1fr)) !important;
          }
          .pattern-column {
            display: contents;
          }
        }
      `
    ];
  }
}

export {
  Cards
};

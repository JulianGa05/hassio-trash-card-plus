import { css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { getDateParts } from '../../../utils/getDateString';
import { customElement } from 'lit/decorators.js';
import { TRASH_CARD_NAME } from '../const';
import { defaultHaCardStyle } from '../../../utils/defaultHaCardStyle';
import { getColoredStyle } from '../../../utils/getColoredStyle';
import { BaseItemElement } from './BaseItemElement';
import { daysTill } from '../../../utils/daysTill';
import { classMap } from 'lit/directives/class-map.js';

const clampPercent = (value: number | undefined, fallback = 100): number => {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(200, Math.max(50, value));
};

@customElement(`${TRASH_CARD_NAME}-item-card`)
class ItemCard extends BaseItemElement {
  public render () {
    if (!this.hass || !this.item || !this.config) {
      return nothing;
    }

    // eslint-disable-next-line prefer-destructuring
    const item = this.item;

    const {
      color_mode,
      hide_time_range,
      day_style,
      layout,
      with_label,
      day_style_format,
      mobile_compact,
      info_layout,
      counter_stacked,
      label_font_size,
      date_font_size,
      counter_font_size
    } = this.config;

    const { label, date } = item;

    const labelScale = clampPercent(label_font_size) / 100;
    const dateScale = clampPercent(date_font_size) / 100;
    const counterScale = clampPercent(counter_font_size) / 100;

    const style = {
      ...getColoredStyle(color_mode, item, this.parentElement, this.hass.themes.darkMode),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '--trash-label-size': `${labelScale}`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '--trash-date-size': `${dateScale}`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '--trash-counter-size': `${counterScale}`
    };

    const compactMobile = Boolean(mobile_compact) && window.matchMedia('(max-width: 600px)').matches;
    const useCompactLayout = info_layout === 'compact' || compactMobile;
    const stackedCounter = Boolean(counter_stacked);
    const parts = getDateParts(
      item,
      hide_time_range ?? false,
      day_style,
      day_style_format,
      this.hass,
      useCompactLayout
    );
    const daysTillToday = daysTill(new Date(), date.start);
    const dateOnly = date.start.toLocaleDateString(this.hass.language, {
      month: 'short',
      day: 'numeric'
    });
    const content = parts.splitCounter ? parts.dateLabel : parts.fullLabel;

    // Right-hand counter for split day styles (including "Heute" / "Morgen").
    const showSideCounter = parts.splitCounter;
    // Today/tomorrow stay a single centered line — never force the stacked "in/vor" layout.
    const useStackedCounter = stackedCounter && Boolean(parts.counterPrefix) && daysTillToday !== 0 && daysTillToday !== 1;

    const cssClasses = {
      today: daysTillToday === 0,
      tomorrow: daysTillToday === 1,
      another: daysTillToday > 1,
      past: Boolean(item.isPast) || daysTillToday < 0,
      'compact-layout': useCompactLayout,
      'counter-stacked': useStackedCounter
    };

    const pictureUrl = this.getPictureUrl();
    const isVertical = layout === 'vertical';
    const contentClasses = {
      vertical: isVertical
    };

    // Left column: label + calendar date. "Heute" belongs on the right, not here.
    const leftTitle = with_label ? label : content;
    const leftDate = with_label ?
      (useCompactLayout ? dateOnly : content) :
      undefined;

    const counterNode = showSideCounter ?
      (useStackedCounter ?
        html`
          <div class="counter-block stacked" aria-label=${parts.counterText}>
            <span class="counter-prefix">${parts.counterPrefix}</span>
            <span class="counter-rest">${parts.counterRest}</span>
          </div>
        ` :
        html`
          <div class="counter-block" aria-hidden="true">${parts.counterText}</div>
        `) :
      nothing;

    const iconOrPicture = pictureUrl ? this.renderPicture(pictureUrl) : this.renderIcon();

    // Vertical: icon+label on one row, divider, then date + relative countdown.
    if (isVertical) {
      return html`
        <ha-card style=${styleMap(style)} class=${classMap(cssClasses)}>
          <div class="background" aria-labelledby="info" ></div>
          <div class="container">
            <div class="content ${classMap(contentClasses)}" >
              <div class="vertical-header" id="info">
                ${iconOrPicture}
                <div class="info-label">${leftTitle}</div>
              </div>
              <div class="vertical-divider" role="presentation"></div>
              <div class="vertical-meta">
                ${leftDate ? html`<div class="info-date">${leftDate}</div>` : nothing}
                ${counterNode}
              </div>
            </div>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card style=${styleMap(style)} class=${classMap(cssClasses)}>
        <div class="background" aria-labelledby="info" ></div>
        <div class="container">
          <div class="content ${classMap(contentClasses)}" >
            ${iconOrPicture}
            <div class="info-block" id="info">
              <div class="info-label">${leftTitle}</div>
              ${leftDate ? html`<div class="info-date">${leftDate}</div>` : nothing}
            </div>
            ${counterNode}
          </div>
        </div>
      </ha-card>
    `;
  }

  public static get styles () {
    return [
      defaultHaCardStyle,
      css`

        :host {
          -webkit-tap-highlight-color: transparent;
          display: block;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          --trash-label-size: 1;
          --trash-date-size: 1;
          --trash-counter-size: 1;
        }

        ha-card {
          --ha-ripple-color: var(--tile-color);
          --ha-ripple-hover-opacity: 0.04;
          --ha-ripple-pressed-opacity: 0.12;
          height: 100%;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          transition:
            box-shadow 180ms ease-in-out,
            border-color 180ms ease-in-out;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        ha-card.past {
          opacity: 0.68;
        }

        .background {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          border-radius: var(--ha-card-border-radius, 12px);
          margin: calc(-1 * var(--ha-card-border-width, 1px));
          overflow: hidden;
        }
        .container {
          margin: calc(-1 * var(--ha-card-border-width, 1px));
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        /*
         * Three independent columns: icon | info | counter.
         * align-items: center vertically centers each column as a whole,
         * so a 2-line counter never "pulls" the label row out of alignment.
         */
        .content {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 8px;
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
          pointer-events: none;
          gap: 8px;
        }

        .info-block {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 1px;
          flex: 1 1 auto;
          min-width: 0;
          align-self: center;
        }

        .info-label {
          max-width: 100%;
          font-size: calc(0.95rem * var(--trash-label-size));
          font-weight: 650;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .info-date {
          max-width: 100%;
          font-size: calc(0.78rem * var(--trash-date-size));
          line-height: 1.2;
          opacity: 0.8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Right column: own shrink-wrapped block, vertically centered in the card */
        .counter-block {
          flex: 0 0 auto;
          align-self: center;
          margin: 0;
          padding: 0;
          font-size: calc(0.82rem * var(--trash-counter-size));
          font-weight: 600;
          line-height: 1.15;
          letter-spacing: -0.01em;
          white-space: nowrap;
          text-align: center;
        }

        /* "in"/"vor" centered over the day count within this block's width */
        .counter-block.stacked {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          line-height: 1.05;
          white-space: normal;
        }

        .counter-prefix {
          display: block;
          width: 100%;
          text-align: center;
          font-size: 0.82em;
          font-weight: 600;
          opacity: 0.85;
          line-height: 1.05;
        }

        .counter-rest {
          display: block;
          text-align: center;
          font-weight: 650;
          line-height: 1.1;
          white-space: nowrap;
        }

        ha-card.compact-layout .content {
          gap: 6px;
          min-height: 44px;
          padding: 5px 6px;
        }
        ha-card.compact-layout ha-tile-icon {
          padding: 1px;
          margin: -1px;
          transform: scale(0.88);
          transform-origin: center;
        }
        ha-card.compact-layout hui-image {
          margin: -2px 0;
        }

        .vertical {
          flex-direction: column;
          text-align: center;
          justify-content: center;
          align-items: center;
          gap: 0;
          padding: 8px 10px;
        }

        .vertical-header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          min-width: 0;
        }

        .vertical-header .info-label {
          flex: 0 1 auto;
          min-width: 0;
        }

        .vertical-divider {
          width: min(72%, 7.5rem);
          height: 1px;
          margin: 7px 0 8px;
          background: currentColor;
          opacity: 0.28;
          flex: 0 0 auto;
        }

        .vertical-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          width: 100%;
          min-width: 0;
        }

        .vertical .info-date {
          opacity: 0.75;
        }

        .vertical .counter-block {
          margin: 0;
        }

        ha-tile-icon,
        hui-image {
          --tile-icon-color: var(--tile-color);
          user-select: none;
          -ms-user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          position: relative;
          padding: 2px;
          margin: -2px;
          flex: 0 0 auto;
          align-self: center;
        }

        hui-image {
          width: 24px;
          height: 24px;
          margin: -12px 0px;
        }

        hui-image img {
          object-fit: cover;
        }

        ha-tile-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          inset-inline-end: -3px;
          inset-inline-start: initial;
        }

        ha-state-icon {
          --tile-icon-color: var(--icon-color);
        }
      `
    ];
  }
}

export {
  ItemCard
};

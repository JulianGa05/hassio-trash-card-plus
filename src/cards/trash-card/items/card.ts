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
    const showStandardCounter = !useCompactLayout && parts.splitCounter && daysTillToday !== 0;
    const showCompactCounter = useCompactLayout && with_label && daysTillToday !== 0;

    const cssClasses = {
      today: daysTillToday === 0,
      tomorrow: daysTillToday === 1,
      another: daysTillToday > 1,
      past: Boolean(item.isPast) || daysTillToday < 0,
      'compact-layout': useCompactLayout,
      'counter-stacked': stackedCounter
    };

    const pictureUrl = this.getPictureUrl();
    const contentClasses = {
      vertical: layout === 'vertical'
    };
    const title = with_label ? label : parts.counterText;
    const dateLine = useCompactLayout ?
      (daysTillToday === 0 ? parts.counterText : dateOnly) :
      (with_label ? content : undefined);

    const renderCounter = (compactClass = false) => {
      if (stackedCounter && parts.counterPrefix) {
        return html`
          <div
            class=${classMap({
              'counter-badge': !compactClass,
              'compact-counter': compactClass,
              stacked: true
            })}
            aria-label=${parts.counterText}
          >
            <span class="counter-prefix">${parts.counterPrefix}</span>
            <span class="counter-rest">${parts.counterRest}</span>
          </div>
        `;
      }

      return html`
        <div
          class=${classMap({
            'counter-badge': !compactClass,
            'compact-counter': compactClass
          })}
          aria-hidden="true"
        >${parts.counterText}</div>
      `;
    };

    return html`
      <ha-card style=${styleMap(style)} class=${classMap(cssClasses)}>
        <div class="background" aria-labelledby="info" ></div>
        <div class="container">
          <div class="content ${classMap(contentClasses)}" >
              ${pictureUrl ? this.renderPicture(pictureUrl) : this.renderIcon()}
            ${useCompactLayout ? html`
              <div class="info-text" id="info">
                <div class="info-row">
                  <span class="info-label">${title}</span>
                  ${showCompactCounter ? renderCounter(true) : nothing}
                </div>
                <div class="info-date">${dateLine}</div>
              </div>
            ` : html`
              <div class="info-text" id="info">
                <div class="info-label">${with_label ? label : content}</div>
                ${with_label && dateLine ? html`<div class="info-date">${dateLine}</div>` : nothing}
              </div>
              ${showStandardCounter ? renderCounter(false) : nothing}
            `}
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
          gap: 6px;
        }
        .info-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1px;
          flex: 1 1 auto;
          min-width: 0;
        }
        .info-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
        }
        .info-label {
          flex: 1 1 auto;
          min-width: 0;
          font-size: calc(0.95rem * var(--trash-label-size));
          font-weight: 650;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .info-date {
          font-size: calc(0.78rem * var(--trash-date-size));
          line-height: 1.2;
          opacity: 0.8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* Standard: counter rechts — kompakt, nicht dominant */
        .counter-badge {
          flex: 0 0 auto;
          margin-left: auto;
          padding: 0;
          font-size: calc(0.82rem * var(--trash-counter-size));
          font-weight: 600;
          line-height: 1.15;
          letter-spacing: -0.01em;
          white-space: nowrap;
          text-align: right;
        }
        .counter-badge.stacked,
        .compact-counter.stacked {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 0;
          line-height: 1.05;
          white-space: normal;
          padding: 0;
        }
        .counter-prefix {
          font-size: 0.85em;
          font-weight: 600;
          opacity: 0.85;
          line-height: 1.05;
        }
        .counter-rest {
          font-weight: 650;
          line-height: 1.05;
        }
        .compact-counter {
          flex: 0 0 auto;
          font-size: calc(0.9em * var(--trash-counter-size));
          font-weight: 600;
          line-height: 1.15;
          white-space: nowrap;
          opacity: 0.95;
          padding: 0;
        }
        ha-card.compact-layout .content {
          gap: 5px;
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
        }

        .vertical .info-text {
          width: 100%;
          flex: 0 0 auto;
          align-items: center;
        }

        .vertical .counter-badge.stacked,
        .vertical .compact-counter.stacked {
          align-items: center;
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

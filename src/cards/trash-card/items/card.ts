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

@customElement(`${TRASH_CARD_NAME}-item-card`)
class ItemCard extends BaseItemElement {
  public render () {
    if (!this.hass || !this.item || !this.config) {
      return nothing;
    }

    // eslint-disable-next-line prefer-destructuring
    const item = this.item;

    const { color_mode, hide_time_range, day_style, layout, with_label, day_style_format, mobile_compact } = this.config;

    const { label, date } = item;

    const style = {
      ...getColoredStyle(color_mode, item, this.parentElement, this.hass.themes.darkMode)
    };

    const compactMobile = Boolean(mobile_compact) && window.matchMedia('(max-width: 600px)').matches;
    const parts = getDateParts(
      item,
      hide_time_range ?? false,
      day_style,
      day_style_format,
      this.hass,
      compactMobile
    );
    const content = parts.splitCounter ? parts.dateLabel : parts.fullLabel;

    const daysTillToday = daysTill(new Date(), date.start);

    const cssClasses = {
      today: daysTillToday === 0,
      tomorrow: daysTillToday === 1,
      another: daysTillToday > 1,
      past: Boolean(item.isPast) || daysTillToday < 0,
      'with-counter': parts.splitCounter,
      'compact-mobile': compactMobile
    };

    const pictureUrl = this.getPictureUrl();

    const contentClasses = {
      vertical: layout === 'vertical',
      'with-counter': parts.splitCounter
    };

    return html`
      <ha-card style=${styleMap(style)} class=${classMap(cssClasses)}>
        <div class="background" aria-labelledby="info" ></div>
        <div class="container">
          <div class="content ${classMap(contentClasses)}" >
              ${pictureUrl ? this.renderPicture(pictureUrl) : this.renderIcon()}
            <ha-tile-info
              id="info"
              .primary=${with_label ? label : content}
              .secondary=${with_label ? content : undefined}
              .multiline=${true}
            ></ha-tile-info>
            ${parts.splitCounter ? html`
              <div class="counter-badge" aria-hidden="true">${parts.counterText}</div>
            ` : nothing}
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
          padding: 10px 12px;
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
          pointer-events: none;
          gap: 10px;
        }
        .content.with-counter ha-tile-info {
          flex: 1 1 auto;
          min-width: 0;
        }
        .counter-badge {
          flex: 0 0 auto;
          margin-left: 4px;
          padding: 2px 0;
          font-size: 1.05em;
          font-weight: 650;
          line-height: 1.2;
          white-space: nowrap;
          opacity: 0.95;
        }
        @media (max-width: 600px) {
          ha-card.compact-mobile .content {
            gap: 8px;
            min-height: 42px;
            padding: 7px 9px;
          }
          ha-card.compact-mobile ha-tile-icon {
            transform: scale(0.85);
            transform-origin: center;
          }
          ha-card.compact-mobile ha-tile-info {
            font-size: 0.9em;
          }
          ha-card.compact-mobile .counter-badge {
            font-size: 0.93em;
            margin-left: 0;
          }
        }
        .vertical {
          flex-direction: column;
          text-align: center;
          justify-content: center;
        }

        .vertical .counter-badge {
          margin-left: 0;
        }

        .vertical ha-tile-info {
          width: 100%;
          flex: 0 0 auto;
        }

        ha-tile-icon,
        hui-image {
          --tile-icon-color: var(--tile-color);
          user-select: none;
          -ms-user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          position: relative;
          padding: 6px;
          margin: -6px;
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

        ha-tile-info {
          position: relative;
          min-width: 0;
          transition: background-color 180ms ease-in-out;
          box-sizing: border-box;
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

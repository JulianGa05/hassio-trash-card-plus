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

    const {
      color_mode,
      hide_time_range,
      day_style,
      layout,
      with_label,
      day_style_format,
      mobile_compact,
      info_layout
    } = this.config;

    const { label, date } = item;

    const style = {
      ...getColoredStyle(color_mode, item, this.parentElement, this.hass.themes.darkMode)
    };

    const compactMobile = Boolean(mobile_compact) && window.matchMedia('(max-width: 600px)').matches;
    const useCompactLayout = info_layout === 'compact' || compactMobile;
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

    const cssClasses = {
      today: daysTillToday === 0,
      tomorrow: daysTillToday === 1,
      another: daysTillToday > 1,
      past: Boolean(item.isPast) || daysTillToday < 0,
      'compact-layout': useCompactLayout
    };

    const pictureUrl = this.getPictureUrl();
    const contentClasses = {
      vertical: layout === 'vertical'
    };
    const title = with_label ? label : parts.counterText;
    const compactDateLine = daysTillToday === 0 ?
      parts.counterText :
      dateOnly;
    const showCompactCounter = with_label && daysTillToday !== 0;

    return html`
      <ha-card style=${styleMap(style)} class=${classMap(cssClasses)}>
        <div class="background" aria-labelledby="info" ></div>
        <div class="container">
          <div class="content ${classMap(contentClasses)}" >
              ${pictureUrl ? this.renderPicture(pictureUrl) : this.renderIcon()}
            ${useCompactLayout ? html`
              <div class="compact-text" id="info">
                <div class="compact-row">
                  <span class="compact-title">${title}</span>
                  ${showCompactCounter ? html`<span class="compact-counter">${parts.counterText}</span>` : nothing}
                </div>
                <div class="compact-date">${compactDateLine}</div>
              </div>
            ` : html`
              <ha-tile-info
                id="info"
                .primary=${with_label ? label : content}
                .secondary=${with_label ? content : undefined}
                .multiline=${true}
              ></ha-tile-info>
              ${showStandardCounter ? html`
                <div class="counter-badge" aria-hidden="true">${parts.counterText}</div>
              ` : nothing}
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
          padding: 8px 10px;
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
          pointer-events: none;
          gap: 8px;
        }
        /* Standard: counter rechts — sichtbar, aber nicht größer als Bezeichnung/Datum */
        .counter-badge {
          flex: 0 0 auto;
          margin-left: auto;
          padding-left: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: -0.01em;
          white-space: nowrap;
          text-align: right;
        }
        .compact-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          flex: 1 1 auto;
          min-width: 0;
        }
        .compact-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }
        .compact-title {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 0.95em;
          font-weight: 650;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .compact-counter {
          flex: 0 0 auto;
          font-size: 0.9em;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          opacity: 0.95;
        }
        .compact-date {
          font-size: 0.78em;
          line-height: 1.2;
          opacity: 0.8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        ha-card.compact-layout .content {
          gap: 6px;
          min-height: 48px;
          padding: 7px 8px;
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

        .vertical ha-tile-info,
        .vertical .compact-text {
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
          padding: 4px;
          margin: -4px;
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
          flex: 1 1 auto;
          min-width: 0;
          transition: background-color 180ms ease-in-out;
          box-sizing: border-box;
        }

        /* Bezeichnung/Datum müssen Platz bekommen — Counter darf sie nicht verdrängen */
        ha-tile-info::part(primary),
        ha-tile-info .primary {
          font-size: 0.95em !important;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        ha-tile-info::part(secondary),
        ha-tile-info .secondary {
          font-size: 0.8em !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

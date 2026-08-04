/* eslint-disable @typescript-eslint/unbound-method */
import { assert } from 'superstruct';
import { computeDarkMode } from '../../utils/computeDarkMode';
import memoizeOne from 'memoize-one';
import setupCustomlocalize from '../../localize';
import { TRASH_CARD_EDITOR_NAME } from './const';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { entityCardConfigStruct } from './trash-card-config';
import { getPatternOthersSchema, getPatternSchema, getSchema } from './formSchemas';
import { fireEvent } from '../../utils/fireEvent';

import './trash-card-pattern-editor';

import type { TrashCardConfig } from './trash-card-config';
import type { CSSResultGroup, PropertyValues } from 'lit';
import type { HomeAssistant } from '../../utils/ha';
import type { SubElementEditorConfig } from './trash-card-pattern-editor';
import type { HaFormSchema } from '../../utils/form/ha-form';

interface DomEvent<T> extends Event {
  detail: T;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface HASSDomEvents {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'config-changed': {
      config: TrashCardConfig;
    };
  }
}

const configDefaults = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  events_per_pattern: 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  include_last_past: false,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  past_days: 60,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sort_by: 'date',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mobile_compact: true,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  drop_todayevents_from: '10:00:00',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  next_days: 2,
  pattern: [
    {
      icon: 'mdi:flower',
      color: 'lime',
      type: 'organic'
    },
    {
      icon: 'mdi:newspaper',
      color: 'blue',
      type: 'paper'
    },
    {
      icon: 'mdi:recycle-variant',
      color: 'amber',
      type: 'recycle'
    },
    {
      icon: 'mdi:trash-can-outline',
      color: 'grey',
      type: 'waste'
    },
    {
      icon: 'mdi:dump-truck',
      color: 'purple',
      type: 'others'
    }
  ],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  day_style: 'default',
  day_style_format: 'yyyy.MM.dd',
  card_style: 'card',
  alignment_style: 'left',
  color_mode: 'background',
  items_per_row: 1,
  refresh_rate: 60,
  with_label: true,
  layout: 'default'
};

@customElement(TRASH_CARD_EDITOR_NAME)
class TrashCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config?: TrashCardConfig;

  @state() private subElementEditorConfig?: SubElementEditorConfig;

  @state() private readonly schema = memoizeOne(getSchema);

  public setConfig (config: Partial<TrashCardConfig>): void {
    assert(config, entityCardConfigStruct);

    const migrated = { ...config };

    // Show numeric field for legacy `event_grouping` configs
    if (migrated.events_per_pattern === undefined && migrated.event_grouping !== undefined) {
      migrated.events_per_pattern = migrated.event_grouping === false ? 0 : 1;
    }

    this.config = {
      ...configDefaults,
      ...migrated
    } as TrashCardConfig;
  }

  protected updated (changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass) {
      const currentDarkMode = computeDarkMode(changedProps.get('hass'));
      const newDarkMode = computeDarkMode(this.hass);

      if (currentDarkMode !== newDarkMode) {
        this.toggleAttribute('dark-mode', newDarkMode);
      }
    }
  }

  private readonly computeLabel = (schema: HaFormSchema) => {
    if (!this.hass) {
      return schema.label;
    }

    return schema.label ?? '';
  };

  private readonly computeHelper = (schema: HaFormSchema) => {
    if (!this.hass) {
      return schema.name;
    }

    return schema.helper ?? '';
  };

  private renderFormPatternsEditor () {
    if (!this.hass) {
      return nothing;
    }

    const customLocalize = setupCustomlocalize(this.hass);

    if (this.subElementEditorConfig) {
      const patternSchema = this.subElementEditorConfig.elementConfig?.type === 'others' ?
        getPatternOthersSchema(this.hass.localize) :
        getPatternSchema(customLocalize, this.hass.localize);

      return html`
        <div class="header" id="trashcard-pattern-editor">
          <div class="back-title">
              <ha-icon-button
                  .label=${this.hass.localize('ui.common.back')}
                  @click=${this.goBack}
              >
                <ha-icon icon="mdi:arrow-left"></ha-icon>
              </ha-icon-button>
              <span slot="title">${customLocalize(`editor.card.trash.pattern.title`)}</span>
          </div>
        </div>
          <ha-form
              .hass=${this.hass}
              .computeLabel=${this.computeLabel}
              .computeHelper=${this.computeHelper}
              .data=${this.subElementEditorConfig.elementConfig}
              .schema=${patternSchema}
              @value-changed=${this.handleSubElementChanged}
          >
          </ha-form>
      `;
    }

    return html`
      <trash-card-pattern-editor
        .hass=${this.hass}
          .pattern=${this.config!.pattern}
          @delete-pattern-item=${this.deletePatternItem}  
          @create-pattern-item=${this.createPatternItem}  
          @edit-pattern-item=${this.editPatternItem}
          @settings-changed=${this.valueChanged}
      ></trash-card-pattern-editor>`;
  }

  private goBack (): void {
    this.subElementEditorConfig = undefined;
  }

  private handleSubElementChanged (ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.config || !this.hass || !this.subElementEditorConfig) {
      return;
    }

    const item = this.subElementEditorConfig.key!;

    const { value } = ev.detail;

    const config = {
      ...this.config,
      pattern: [
        ...this.config.pattern ?? []
      ]
    };

    config.pattern[item] = value;

    this.subElementEditorConfig = {
      ...this.subElementEditorConfig,
      elementConfig: value
    };

    fireEvent(this, 'config-changed', { config });
  }

  private editPatternItem (ev: DomEvent<{ subElementConfig: SubElementEditorConfig }>): void {
    this.subElementEditorConfig = ev.detail.subElementConfig;
  }

  // eslint-disable-next-line class-methods-use-this
  protected createPatternItem (ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.config || !this.hass) {
      return;
    }

    const customLocalize = setupCustomlocalize(this.hass);

    const config = {
      ...this.config,
      pattern: [
        ...this.config.pattern ?? []
      ]
    };

    const newIdx = config.
      pattern.
      filter(pat => pat.type === 'custom').
      length + 1;

    config.pattern.push({
      label: `${customLocalize('editor.card.trash.pattern.new_custom_label')} ${newIdx}`,
      icon: 'mdi:calendar',
      color: 'pink',
      type: 'custom'
    });

    fireEvent(this, 'config-changed', { config });
  }

  protected deletePatternItem (ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.config || !this.hass) {
      return;
    }

    const config = {
      ...this.config,
      pattern: [
        ...this.config.pattern ?? []
      ]
    };

    config.pattern.splice(ev.detail.index, 1);

    fireEvent(this, 'config-changed', { config });
  }

  protected render () {
    if (!this.hass || !this.config) {
      return nothing;
    }
    const customLocalize = setupCustomlocalize(this.hass);

    const schema = this.schema(customLocalize, this.config, this.hass.localize);

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${schema}
        .computeLabel=${this.computeLabel}
        .computeHelper=${this.computeHelper}
        @value-changed=${this.valueChanged}
      ></ha-form>
      <ha-expansion-panel id="pattern-expansion-panel" outlined >
        <div slot="header" role="heading" aria-level="3" >
          <ha-icon icon="mdi:image-filter-center-focus">
          </ha-icon>
          ${customLocalize('editor.form.tabs.patterns')}
        </div>
        <div class="content">
          ${this.renderFormPatternsEditor()}
        </div>
      </ha-form-expandable>

    `;
  }

  protected valueChanged (ev: CustomEvent): void {
    const config = { ...ev.detail.value };

    if (config.color_mode === 'background') {
      delete config.color_mode;
    }

    if (config.day_style === 'default') {
      delete config.day_style;
    }
    if (config.day_style !== 'custom') {
      delete config.day_style_format;
    }

    if (config.card_style === 'card') {
      delete config.card_style;
    }

    if (config.layout === 'default') {
      delete config.layout;
    }

    if (config.sort_by === 'date') {
      delete config.sort_by;
    }

    if (config.mobile_compact) {
      delete config.mobile_compact;
    }

    if (!config.include_last_past) {
      delete config.include_last_past;
      delete config.past_days;
    } else if (config.past_days === 60) {
      delete config.past_days;
    }

    // Migrate legacy boolean → numeric limit; drop obsolete key from saved config
    if (config.events_per_pattern === undefined && config.event_grouping !== undefined) {
      config.events_per_pattern = config.event_grouping === false ? 0 : 1;
    }
    delete config.event_grouping;

    if (config.events_per_pattern === 1) {
      delete config.events_per_pattern;
    }

    fireEvent(this, 'config-changed', { config });
  }

  public static get styles (): CSSResultGroup {
    return [
      css`
        #trashcard-pattern-editor header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        #trashcard-pattern-editor .back-title {
            display: flex;
            align-items: center;
            font-size: 18px;
        }

        #trashcard-pattern-editor ha-icon {
             display: flex;
             align-items: center;
             justify-content: center;
         }

        #pattern-expansion-panel {
          margin-top: 24px;
          display: flex !important;
          flex-direction: column;
        }

        #pattern-expansion-panel ha-form {
          display: block;
        }

        #pattern-expansion-panel .content {
          padding: 12px;
        }

        #pattern-expansion-panel {
          display: block;
          --expansion-panel-content-padding: 0;
          border-radius: 6px;
          --ha-card-border-radius: 6px;
        }
        #ha-expansion-panel ha-svg-icon,
        #ha-expansion-panel ha-icon {
          color: var(--secondary-text-color);
        }
      `
    ];
  }
}

export {
  TrashCardEditor
};

const AutoSacTypeTab = {
  props: {
    glyphType: String,
  },
  data: function () {
    return {
      scoreThreshold: 0,
      effectScores: Object.assign({}, AutoGlyphSacrifice.types[this.glyphType].effectScores),
    };
  },
  computed: {
    typeConfig() {
      return GlyphTypes[this.glyphType];
    },
    autoSacrificeSettings() {
      return AutoGlyphSacrifice.types[this.glyphType];
    },
    effects() {
      return this.typeConfig.effects;
    },
    descStyle() {
      return {
        "border-color": this.typeConfig.color,
      };
    },
    minScoreInputStyle() {
      // override some properties of the number input to match row style:
      return {
        "font-size": "larger",
        "border-width": "0.2rem",
      };
    }
  },
  methods: {
    update() {
      this.scoreThreshold = this.autoSacrificeSettings.scoreThreshold;
      for (e of this.effects) {
        this.effectScores[e.id] = this.autoSacrificeSettings.effectScores[e.id];
      }
    },
    setScoreThreshold(event) {
      let inputValue = event.target.value;
      if (!isNaN(inputValue)) {
        this.autoSacrificeSettings.scoreThreshold = Math.min(200, Math.max(inputValue, 0));
      }
    },
    setEffectScore(id, event) {
      let inputValue = event.target.value;
      if (!isNaN(inputValue)) {
        this.autoSacrificeSettings.effectScores[id] = Math.min(200, Math.max(inputValue, 0));
      }
    },
  },
  template: /*html*/`
    <div class="l-auto-sac-type-tab">
      <div class="l-auto-sac-type-tab__row-wrapper">
        <div>
          <div class="c-auto-sac-type-tab__header">
            Minimum score
            <div class="o-questionmark" ach-tooltip="The score of a glyph is its rarity % plus the specified amount for each effect it has">?</div>
          </div>
          <div class="l-auto-sac-type-tab__help-text">
            rarity % + Σ effects
          </div>
        </div>
        <input type="number" min="0" max="200" :value="scoreThreshold"
               ref="scoreThreshold" @blur="setScoreThreshold"
               class="c-auto-sac-type-tab__input"
               :style="minScoreInputStyle"/>
      </div>
      <div v-for="effect in effects" class="l-auto-sac-type-tab__row-wrapper">
        <div class="c-auto-sac-type-tab__effect-desc l-auto-sac-type-tab__effect-desc" :style="descStyle">
          {{effect.genericDesc}}
        </div>
        <input type="number" min="0" max="200" :value="effectScores[effect.id]"
               @blur="setEffectScore(effect.id, $event)"
               class="c-auto-sac-type-tab__input"/>
      </div>
    </div>
  `
};

Vue.component("glyph-sacrifice-options", {
  components: {
    "auto-sac-type-tab": AutoSacTypeTab,
  },
  data: function () {
    return {
      mode: AutoGlyphSacMode.NONE,
      advancedType: GLYPH_TYPES[0],
      // Note: there are two units at play: strength is from 1..3.5+; rarity is 0..100
      rarityThresholds: GLYPH_TYPES.mapToObject(e => e, e => 0),
    };
  },
  computed: {
    modes() {
      return AutoGlyphSacMode;
    },
    glyphTypes() {
      return GlyphTypes.list;
    },
    raritySliderProps() {
      return {
        min: 0,
        max: 100,
        width: "14rem",
        valueInDot: true,
        tooltip: "never",
        "dot-width": "2.2rem",
        "dot-height": "1.6rem",
        "dot-class": "c-glyph-sacrifice-options__rarity-slider-handle",
        "bg-class": "c-glyph-sacrifice-options__rarity-slider-bg",
        "process-class": "c-glyph-sacrifice-options__rarity-slider-process",
        style: {
          "margin-left": "1rem",
        }
      };
    },
    glyphIconProps() {
      return {
        size: "3rem",
        "glow-blur": "0.3rem",
        "glow-spread": "0.1rem",
        "text-proportion": 0.66
      }
    },
    effectFilterButtonClass() {
      return this.effectFilters[type].enabled
        ? ".c-glyph-sacrifice-options__advanced-toggle--off"
        : ".c-glyph-sacrifice-options__advanced-toggle--on"
    },
  },
  methods: {
    optionClass(idx) {
      return [idx == this.mode
        ? "c-glyph-sacrifice-options__option--active"
        : "c-glyph-sacrifice-options__option--inactive",
        "c-glyph-sacrifice-options__option",
        "l-glyph-sacrifice-options__option"];
    },
    strengthThreshold(type) {
      return rarityToStrength(this.rarityThresholds[type]);
    },
    advancedTypeSelectStyle(type) {
      return type.id === this.advancedType ? {
        color: type.color,
        "text-shadow": `0 0 0.25rem ${type.color}, 0 0 0.5rem ${type.color}, 0 0 0.75rem ${type.color}, 0 0 1rem ${type.color}`,
      } : {}
    },
    update() {
      this.mode = AutoGlyphSacrifice.mode;
      for (type of GLYPH_TYPES) {
        this.rarityThresholds[type] = AutoGlyphSacrifice.types[type].rarityThreshold;
      }
    },
    setMode(m) {
      AutoGlyphSacrifice.mode = m;
    },
    setRarityThreshold(id, value) {
      AutoGlyphSacrifice.types[id].rarityThreshold = value;
    }
  },
  template: /*html*/`
  <div class="l-glyph-sacrifice-options c-glyph-sacrifice-options">
    <div :class="optionClass(0)" @click="setMode(modes.NONE)">
      Auto sacrifice disabled
    </div>
    <div :class="optionClass(1)" @click="setMode(modes.ALL)">
      Auto sacrifice all
    </div>
    <div :class="optionClass(2)" @click="setMode(modes.RARITY_THRESHOLDS)">
      Set rarity requirements
    </div>
    <div :class="optionClass(3)" @click="setMode(modes.ADVANCED)">
    ❃.✮:▹ Advanced mode ◃:✮.❃
    </div>
    <div v-if="mode === 2" class="l-glyph-sacrifice-options__rarity-sliders c-glyph-sacrifice-options__rarity-sliders">
      <div v-for="type in glyphTypes" :key="type.id" class="l-glyph-sacrifice-options__rarity-slider-div">
        <glyph-component :glyph="{type: type.id, strength: strengthThreshold(type.id) }" v-bind="glyphIconProps"/>
        <ad-slider-component v-bind="raritySliderProps" :value="rarityThresholds[type.id]"
                             @input="setRarityThreshold(type.id, $event)"/>
      </div>
    </div>
    <div v-if="mode === 3" class="l-glyph-sacrifice-options__advanced c-glyph-sacrifice-options__advanced">
      <span v-for="type in glyphTypes" :key="type.id"
            class="l-glyph-sacrifice-options__advanced-type-select c-glyph-sacrifice-options__advanced-type-select"
            :style="advancedTypeSelectStyle(type)" @click="advancedType=type.id">
        {{type.symbol}}
      </span>
      <template v-for="type in glyphTypes">
        <auto-sac-type-tab v-show="type.id === advancedType" :glyph-type="type.id"/>
      </template>
    </div>
  </div>
  `
});

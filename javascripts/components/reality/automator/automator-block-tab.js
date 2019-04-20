Vue.component("automator-tab", {
  data: function() {
    return {
      lines: []
    }
  },
  methods: {
    update() {
      //console.log(this.lines.length)
    },
    updateBlocks(lines) {
      this.lines = lines;
    }
  },
  template:
    `<div class="c-automator l-automator l-automator-tab__automator">
      <split-pane :min-percent="20" :default-percent="40" split="vertical" class="_-automator-split-pane-fix">
        <automator-block-editor slot="paneL"/>
        <automator-blocks slot="paneR"/>
      </split-pane>
    </div>`
});
/** @type {ItemRateFrontend} */
const Common = require("lib/common");

module.exports = {
  config: {
    scale: 1, //size multiplier
    topMargin: 240, //offset from top
    barWidth: 168, //rate bar width
    barHeight: 36, //rate bar height
    barSpacing: 4, //gap between bars
    iconSize: 24, //item icon size
    iconRightPadding: 8, //gap after icon
    rateTextMinWidth: 64, //rate text width
    modeButtonWidth: 48, //mode button width
    modeButtonHeight: 28, //mode button height
    modeButtonSpacing: 4, //gap between buttons
    fullTextMinWidth: 32 //full text width
  },
  rateTable: null,
  barsTable: null,
  itemRateBackend: null,
  rateMode: "second",

  start: function(itemRateBackend) {
    const itemRateFrontend = this;
    itemRateFrontend.itemRateBackend = itemRateBackend;

    Events.on(ClientLoadEvent, function() {
      itemRateFrontend.build();
    });
  },

  build: function() {
    const itemRateFrontend = this;

    itemRateFrontend.rateTable = new Table();
    itemRateFrontend.rateTable.setFillParent(true);
    itemRateFrontend.rateTable.top().right();
    itemRateFrontend.rateTable.marginTop(itemRateFrontend.scaled(itemRateFrontend.config.topMargin));

    itemRateFrontend.addRateModeButtons(itemRateFrontend.rateTable);
    itemRateFrontend.barsTable = new Table();
    itemRateFrontend.rateTable.add(itemRateFrontend.barsTable).row();

    Vars.ui.hudGroup.addChild(itemRateFrontend.rateTable);

    Events.run(Trigger.update, function() {
      itemRateFrontend.rebuild();
    });
  },

  rebuild: function() {
    const itemRateFrontend = this;
    const barsTable = itemRateFrontend.barsTable;
    const itemRateBackend = itemRateFrontend.itemRateBackend;

    barsTable.clear();

    if (!Vars.state.isGame()) {
      return;
    }

    if (itemRateBackend.itemStats.length === 0) {
      return;
    }

    for (let i = 0; i < itemRateBackend.itemStats.length; i++) {
      itemRateFrontend.addRateBar(barsTable, itemRateBackend.itemStats[i]);
    }
  },

  addRateModeButtons: function(rateTable) {
    const itemRateFrontend = this;
    const config = itemRateFrontend.config;

    rateTable.table(Tex.clear, function(buttonTable) {
      buttonTable.button("/s", function() {
        itemRateFrontend.rateMode = "second";
      })
        .width(itemRateFrontend.scaled(config.modeButtonWidth))
        .height(itemRateFrontend.scaled(config.modeButtonHeight))
        .padRight(itemRateFrontend.scaled(config.modeButtonSpacing));

      buttonTable.button("/m", function() {
        itemRateFrontend.rateMode = "minute";
      })
        .width(itemRateFrontend.scaled(config.modeButtonWidth))
        .height(itemRateFrontend.scaled(config.modeButtonHeight));
    })
      .padBottom(itemRateFrontend.scaled(config.barSpacing))
      .row();
  },

  addRateBar: function(rateTable, itemStats) {
    const itemRateFrontend = this;
    const config = itemRateFrontend.config;

    rateTable.table(Tex.button, function(bar) {
      bar.image(itemStats.item.uiIcon)
        .size(itemRateFrontend.scaled(config.iconSize))
        .padRight(itemRateFrontend.scaled(config.iconRightPadding));

      bar.add(itemRateFrontend.formatRate(itemStats))
        .color(itemRateFrontend.getRateColor(itemStats))
        .minWidth(itemRateFrontend.scaled(config.rateTextMinWidth))
        .right();

      if (itemStats.isFull) {
        bar.add("FULL")
          .color(Color.scarlet)
          .minWidth(itemRateFrontend.scaled(config.fullTextMinWidth))
          .right()
          .padLeft(itemRateFrontend.scaled(config.iconRightPadding));
      }
    })
      .height(itemRateFrontend.scaled(config.barHeight))
      .width(itemRateFrontend.scaled(config.barWidth))
      .padBottom(itemRateFrontend.scaled(config.barSpacing))
      .row();
  },

  scaled: function(value) {
    return value * this.config.scale;
  },

  getRateColor: function(itemStats) {
    if (itemStats.isFull) {
      return Color.gray;
    }

    const rate = this.getDisplayRate(itemStats);
    const thresholdScale = this.getThresholdScale();

    return Common.scaledColor(rate, 10 * thresholdScale, 100 * thresholdScale, Color.gray);
  },

  getThresholdScale: function() {
    if (this.rateMode === "minute") {
      return 60;
    }

    return 1;
  },

  formatRate: function(itemStats) {
    const displayRate = this.getDisplayRate(itemStats);
    let rounded = Math.round(displayRate);

    if (displayRate > -1 && displayRate < 1 && displayRate !== 0) {
      rounded = Math.round(displayRate * 10) / 10;
    }

    if (rounded > 0) {
      return "+" + rounded + this.getRateUnit();
    }

    return rounded + this.getRateUnit();
  },

  getDisplayRate: function(itemStats) {
    if (this.rateMode === "minute") {
      return itemStats.netRatePerMinute;
    }

    return itemStats.netRatePerSecond;
  },

  getRateUnit: function() {
    if (this.rateMode === "minute") {
      return "/m";
    }

    return "/s";
  }
};

/** @type {ItemRateFrontend} */
const Common = require("lib/common");

module.exports = {
  config: {
    scale: 1, //size multiplier
    leftMargin: 16, //offset from left
    topMargin: 448, //offset from top
    barHeight: 24, //rate bar height
    barSpacing: 4, //gap between bars
    iconSize: 20, //item icon size
    iconRightPadding: 8, //gap after icon
    rateTextWidth: 64, //rate text width
    modeButtonWidth: 48, //mode button width
    modeButtonHeight: 28, //mode button height
    modeButtonSpacing: 4, //gap between buttons
    fullTextMinWidth: 28 //full text width
  },
  rateBackgroundTable: null,
  rateTable: null,
  barsBackgroundTable: null,
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

    itemRateFrontend.rateBackgroundTable = new Table();
    itemRateFrontend.rateBackgroundTable.setFillParent(true);
    itemRateFrontend.rateBackgroundTable.top().left();
    itemRateFrontend.rateBackgroundTable.marginTop(itemRateFrontend.scaled(itemRateFrontend.config.topMargin + itemRateFrontend.config.modeButtonHeight + itemRateFrontend.config.barSpacing));
    itemRateFrontend.barsBackgroundTable = new Table();
    itemRateFrontend.rateBackgroundTable.add(itemRateFrontend.barsBackgroundTable)
      .left()
      .row();
    Vars.ui.hudGroup.addChild(itemRateFrontend.rateBackgroundTable);

    itemRateFrontend.rateTable = new Table();
    itemRateFrontend.rateTable.setFillParent(true);
    itemRateFrontend.rateTable.top().left();
    itemRateFrontend.rateTable.marginLeft(itemRateFrontend.scaled(itemRateFrontend.config.leftMargin));
    itemRateFrontend.rateTable.marginTop(itemRateFrontend.scaled(itemRateFrontend.config.topMargin));

    itemRateFrontend.addRateModeButtons(itemRateFrontend.rateTable);
    itemRateFrontend.barsTable = new Table();
    itemRateFrontend.rateTable.add(itemRateFrontend.barsTable)
      .left()
      .row();

    Vars.ui.hudGroup.addChild(itemRateFrontend.rateTable);

    Events.run(Trigger.update, function() {
      itemRateFrontend.rebuild();
    });
  },

  rebuild: function() {
    const itemRateFrontend = this;
    const barsBackgroundTable = itemRateFrontend.barsBackgroundTable;
    const barsTable = itemRateFrontend.barsTable;
    const itemRateBackend = itemRateFrontend.itemRateBackend;

    barsBackgroundTable.clear();
    barsTable.clear();

    if (!Vars.state.isGame()) {
      return;
    }

    if (itemRateBackend.itemStats.length === 0) {
      return;
    }

    for (let i = 0; i < itemRateBackend.itemStats.length; i++) {
      itemRateFrontend.addRateBackground(barsBackgroundTable);
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
      .left()
      .row();
  },

  addRateBar: function(rateTable, itemStats) {
    const itemRateFrontend = this;
    const config = itemRateFrontend.config;
    const accentWidth = itemRateFrontend.getAccentWidth();
    const rateColor = itemRateFrontend.getRateColor(itemStats);

    rateTable.table(Tex.clear, function(bar) {
      bar.left();

      bar.image(itemStats.item.uiIcon)
        .size(itemRateFrontend.scaled(config.iconSize))
        .padRight(itemRateFrontend.scaled(config.iconRightPadding));

      bar.add(itemRateFrontend.formatRate(itemStats))
        .color(rateColor)
        .width(itemRateFrontend.scaled(config.rateTextWidth))
        .right();

      bar.image(Tex.whiteui)
        .color(rateColor)
        .width(itemRateFrontend.scaled(accentWidth))
        .height(itemRateFrontend.scaled(config.barHeight))
        .padLeft(itemRateFrontend.scaled(config.iconRightPadding));
    })
      .height(itemRateFrontend.scaled(config.barHeight))
      .width(itemRateFrontend.scaled(itemRateFrontend.getRateCardContentWidth()))
      .padBottom(itemRateFrontend.scaled(config.barSpacing));

    rateTable.add(itemStats.isFull ? "FULL" : "")
      .color(Color.green)
      .width(itemRateFrontend.scaled(config.fullTextMinWidth))
      .left()
      .fillX()
      .padLeft(itemRateFrontend.scaled(4))
      .padBottom(itemRateFrontend.scaled(config.barSpacing))
      .row();
  },

  addRateBackground: function(backgroundTable) {
    const itemRateFrontend = this;
    const config = itemRateFrontend.config;

    backgroundTable.image(Styles.black6)
      .height(itemRateFrontend.scaled(config.barHeight))
      .width(itemRateFrontend.scaled(config.leftMargin + itemRateFrontend.getRateCardContentWidth()))
      .padBottom(itemRateFrontend.scaled(config.barSpacing))
      .row();
  },

  getAccentWidth: function() {
    return 4;
  },

  getRateCardContentWidth: function() {
    const config = this.config;

    return config.iconSize
      + config.iconRightPadding
      + config.rateTextWidth
      + config.iconRightPadding
      + this.getAccentWidth();
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
    const formatted = Common.formatNumber(displayRate, true);

    if (displayRate > 0) {
      return "+" + formatted + this.getRateUnit();
    }

    return formatted + this.getRateUnit();
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

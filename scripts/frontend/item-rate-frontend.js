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
    rateTextWidth: 72, //rate text width
    fullIndicatorWidth: 28, //full indicator column width
    fullIndicatorSize: 14 //full indicator icon size
  },
  rateBackgroundTable: null,
  rateTable: null,
  barsBackgroundTable: null,
  barsTable: null,
  itemRateBackend: null,

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
    itemRateFrontend.rateBackgroundTable.marginTop(itemRateFrontend.scaled(itemRateFrontend.config.topMargin + itemRateFrontend.config.barHeight + itemRateFrontend.config.barSpacing));
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

    itemRateFrontend.rateTable.add("Rates")
      .color(Color.white)
      .left()
      .width(itemRateFrontend.scaled(itemRateFrontend.getRateCardContentWidth()))
      .height(itemRateFrontend.scaled(itemRateFrontend.config.barHeight))
      .padBottom(itemRateFrontend.scaled(itemRateFrontend.config.barSpacing))
      .row();

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

    if (!Vars.state.isGame()) {
      barsBackgroundTable.clear();
      barsTable.clear();
      return;
    }

    if (itemRateFrontend.barsTable.hasMouse()) {
      return;
    }

    barsBackgroundTable.clear();
    barsTable.clear();

    if (itemRateBackend.itemStats.length === 0) {
      return;
    }

    for (let i = 0; i < itemRateBackend.itemStats.length; i++) {
      itemRateFrontend.addRateBackground(barsBackgroundTable);
      itemRateFrontend.addRateBar(barsTable, itemRateBackend.itemStats[i]);
    }
  },

  addRateBar: function(rateTable, itemStats) {
    const itemRateFrontend = this;
    const config = itemRateFrontend.config;
    const accentWidth = itemRateFrontend.getAccentWidth();
    const rateColor = itemRateFrontend.getRateColor(itemStats);

    rateTable.table(Tex.clear, function(bar) {
      bar.left();
      bar.touchable = Touchable.enabled;

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
      .padBottom(itemRateFrontend.scaled(config.barSpacing))
      .tooltip(itemStats.item.localizedName);

    rateTable.table(Tex.clear, function(indicator) {
      indicator.left();

      if (itemStats.isFull) {
        indicator.image(Icon.okSmall)
          .color(Color.gray)
          .size(itemRateFrontend.scaled(config.fullIndicatorSize));
      }
    })
      .width(itemRateFrontend.scaled(config.fullIndicatorWidth))
      .left()
      .fillX()
      .padLeft(itemRateFrontend.scaled(6))
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

    return Common.scaledColor(rate, 10, 100, Color.gray);
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
    return itemStats.netRatePerSecond;
  },

  getRateUnit: function() {
    return "/s";
  }
};

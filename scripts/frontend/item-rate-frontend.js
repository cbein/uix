/** @type {ItemRateFrontend} */
module.exports = {
  config: {
    scale: 1,
    topMargin: 240,
    barWidth: 128,
    barHeight: 36,
    barSpacing: 4,
    iconSize: 24,
    iconRightPadding: 8,
    rateTextMinWidth: 64,
    highPositiveColor: Color.valueOf("3399ff")
  },
  rateTable: null,
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

    itemRateFrontend.rateTable = new Table();
    itemRateFrontend.rateTable.setFillParent(true);
    itemRateFrontend.rateTable.top().right();
    itemRateFrontend.rateTable.marginTop(itemRateFrontend.scaled(itemRateFrontend.config.topMargin));

    Vars.ui.hudGroup.addChild(itemRateFrontend.rateTable);

    Events.run(Trigger.update, function() {
      itemRateFrontend.rebuild();
    });
  },

  rebuild: function() {
    const itemRateFrontend = this;
    const rateTable = itemRateFrontend.rateTable;
    const itemRateBackend = itemRateFrontend.itemRateBackend;

    rateTable.clear();

    if (!Vars.state.isGame() || itemRateBackend.itemStats.length === 0) {
      return;
    }

    for (let i = 0; i < itemRateBackend.itemStats.length; i++) {
      itemRateFrontend.addRateBar(rateTable, itemRateBackend.itemStats[i]);
    }
  },

  addRateBar: function(rateTable, itemStats) {
    const itemRateFrontend = this;
    const config = itemRateFrontend.config;

    rateTable.table(Tex.button, function(bar) {
      bar.image(itemStats.item.uiIcon)
        .size(itemRateFrontend.scaled(config.iconSize))
        .padRight(itemRateFrontend.scaled(config.iconRightPadding));

      bar.add(itemRateFrontend.formatRate(itemStats.rate))
        .color(itemRateFrontend.getRateColor(itemStats.rate))
        .minWidth(itemRateFrontend.scaled(config.rateTextMinWidth))
        .right();
    })
      .height(itemRateFrontend.scaled(config.barHeight))
      .width(itemRateFrontend.scaled(config.barWidth))
      .padBottom(itemRateFrontend.scaled(config.barSpacing))
      .row();
  },

  scaled: function(value) {
    return value * this.config.scale;
  },

  getRateColor: function(rate) {
    if (rate >= 100) {
      return this.config.highPositiveColor;
    }

    if (rate >= 10) {
      return Color.green;
    }

    if (rate <= -100) {
      return Color.red;
    }

    if (rate <= -10) {
      return Color.orange;
    }

    if (rate < 0) {
      return Color.yellow;
    }

    if (rate > 0) {
      return Color.white;
    }

    return Color.gray;
  },

  formatRate: function(rate) {
    let rounded = Math.round(rate);

    if (rate > -1 && rate < 1 && rate !== 0) {
      rounded = Math.round(rate * 10) / 10;
    }

    if (rounded > 0) {
      return "+" + rounded + "/s";
    }

    return rounded + "/s";
  }
};

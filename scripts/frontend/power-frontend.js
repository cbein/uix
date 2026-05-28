/** @type {PowerFrontend} */
const Common = require("lib/common");

module.exports = {
  config: {
    scale: 1, //size multiplier
    leftMargin: 16, //offset from left
    topMargin: 240, //offset from top
    iconSize: 20, //row icon size
    iconRightPadding: 8, //gap after icon
    valueWidth: 136, //value column width
    rowHeight: 40, //row height
    powerUnitsPerSecond: 60 //ticks to seconds
  },
  powerBackgroundTable: null,
  powerBackend: null,
  powerTable: null,

  start: function(powerBackend) {
    const powerFrontend = this;
    powerFrontend.powerBackend = powerBackend;

    Events.on(ClientLoadEvent, function() {
      powerFrontend.build();
    });
  },

  build: function() {
    const powerFrontend = this;
    const config = powerFrontend.config;

    powerFrontend.powerBackgroundTable = new Table();
    powerFrontend.powerBackgroundTable.setFillParent(true);
    powerFrontend.powerBackgroundTable.top().left();
    powerFrontend.powerBackgroundTable.marginTop(powerFrontend.scaled(config.topMargin + config.rowHeight + 4));
    Vars.ui.hudGroup.addChild(powerFrontend.powerBackgroundTable);

    powerFrontend.powerTable = new Table();
    powerFrontend.powerTable.setFillParent(true);
    powerFrontend.powerTable.top().left();
    powerFrontend.powerTable.marginLeft(powerFrontend.scaled(config.leftMargin));
    powerFrontend.powerTable.marginTop(powerFrontend.scaled(config.topMargin));
    Vars.ui.hudGroup.addChild(powerFrontend.powerTable);

    Events.run(Trigger.update, function() {
      powerFrontend.rebuild();
    });
  },

  rebuild: function() {
    const powerFrontend = this;
    const powerBackgroundTable = powerFrontend.powerBackgroundTable;
    const powerTable = powerFrontend.powerTable;
    const summary = powerFrontend.powerBackend.powerSummary;

    powerBackgroundTable.clear();
    powerTable.clear();

    if (!Vars.state.isGame() || summary.networkCount === 0) {
      return;
    }

    powerTable.add("Power")
      .color(Color.white)
      .left()
      .width(powerFrontend.scaled(powerFrontend.getRowContentWidth()))
      .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
      .padBottom(powerFrontend.scaled(4))
      .row();

    powerFrontend.addRowBackground(powerBackgroundTable);
    powerFrontend.addRow(powerTable, Icon.tree, Common.formatNumber(summary.networkCount, false), Pal.power);
    powerFrontend.addRowBackground(powerBackgroundTable);
    powerFrontend.addPowerRow(powerTable, Icon.power, summary.totalNet, powerFrontend.getNetColor(summary.totalNet));
    powerFrontend.addRowBackground(powerBackgroundTable);
    powerFrontend.addBatteryRow(powerTable, Icon.trello, summary, powerFrontend.getBatteryColor(summary));
  },

  addRow: function(powerTable, icon, value, valueColor) {
    const powerFrontend = this;

    powerFrontend.addCardRow(powerTable, icon, valueColor, valueColor, function(row) {
      powerFrontend.addTextValue(row, "" + value, valueColor);
    });
  },

  addPowerRow: function(powerTable, icon, value, valueColor) {
    const powerFrontend = this;
    const power = powerFrontend.formatPower(value);

    powerFrontend.addCardRow(powerTable, icon, valueColor, valueColor, function(row) {
      row.table(Tex.clear, function(valueTable) {
        valueTable.right();
        valueTable.add(power.amount)
          .color(valueColor)
          .right();

        valueTable.add(power.suffix)
          .color(Color.gray)
          .padLeft(powerFrontend.scaled(1))
          .right();
      })
        .width(powerFrontend.scaled(powerFrontend.config.valueWidth))
        .right();
    });
  },

  addBatteryRow: function(powerTable, icon, summary, valueColor) {
    const powerFrontend = this;
    const battery = powerFrontend.formatBattery(summary);

    powerFrontend.addCardRow(powerTable, icon, valueColor, valueColor, function(row) {
      row.table(Tex.clear, function(valueTable) {
        valueTable.right();
        powerFrontend.addFormattedNumber(valueTable, battery.stored, valueColor);
        valueTable.add("/")
          .color(Color.gray)
          .right();
        powerFrontend.addFormattedNumber(valueTable, battery.capacity, valueColor);
      })
        .width(powerFrontend.scaled(powerFrontend.config.valueWidth))
        .right();
    });
  },

  addFormattedNumber: function(valueTable, formatted, valueColor) {
    const split = this.splitFormattedNumber(formatted);

    valueTable.add(split.amount)
      .color(valueColor)
      .right();

    if (split.suffix !== "") {
      valueTable.add(split.suffix)
        .color(Color.gray)
        .padLeft(this.scaled(1))
        .right();
    }
  },

  splitFormattedNumber: function(formatted) {
    if (formatted.indexOf("mil") >= 0) {
      return {
        amount: formatted.replace("mil", ""),
        suffix: "mil"
      };
    }

    if (formatted.indexOf("k") >= 0) {
      return {
        amount: formatted.replace("k", ""),
        suffix: "k"
      };
    }

    return {
      amount: formatted,
      suffix: ""
    };
  },

  addTextValue: function(row, value, valueColor) {
    const powerFrontend = this;

    row.table(Tex.clear, function(valueTable) {
      valueTable.right();
      valueTable.add(value)
        .color(valueColor)
        .right();
    })
      .width(powerFrontend.scaled(powerFrontend.config.valueWidth))
      .right();
  },

  addCardRow: function(powerTable, icon, iconColor, accentColor, addValue) {
    const powerFrontend = this;
    const accentWidth = powerFrontend.getAccentWidth();
    const rowSpacing = 4;

    powerTable.table(Tex.clear, function(row) {
      row.left();

      row.image(icon)
        .size(powerFrontend.scaled(powerFrontend.config.iconSize))
        .color(iconColor)
        .padRight(powerFrontend.scaled(powerFrontend.config.iconRightPadding));

      addValue(row);

      row.image(Tex.whiteui)
        .color(accentColor)
        .width(powerFrontend.scaled(accentWidth))
        .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
        .padLeft(powerFrontend.scaled(8));
    })
      .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
      .width(powerFrontend.scaled(powerFrontend.getRowContentWidth()))
      .padBottom(powerFrontend.scaled(rowSpacing))
      .row();
  },

  addRowBackground: function(backgroundTable) {
    const powerFrontend = this;
    const rowSpacing = 4;

    backgroundTable.image(Styles.black6)
      .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
      .width(powerFrontend.scaled(powerFrontend.config.leftMargin + powerFrontend.getRowContentWidth()))
      .padBottom(powerFrontend.scaled(rowSpacing))
      .row();
  },

  getAccentWidth: function() {
    return 4;
  },

  getRowContentWidth: function() {
    const config = this.config;

    return config.iconSize
      + config.iconRightPadding
      + config.valueWidth
      + config.iconRightPadding
      + this.getAccentWidth();
  },

  scaled: function(value) {
    return value * this.config.scale;
  },

  formatPower: function(value) {
    const perSecond = value * this.config.powerUnitsPerSecond;
    const formatted = Common.formatNumber(perSecond, false);
    const split = this.splitFormattedNumber(formatted);

    return {
      amount: split.amount,
      suffix: split.suffix + "/s"
    };
  },

  formatBattery: function(summary) {
    if (summary.totalBatteryCapacity <= 0) {
      return {
        stored: "0",
        capacity: "0"
      };
    }

    return {
      stored: Common.formatNumber(summary.totalBatteryStored, false),
      capacity: Common.formatNumber(summary.totalBatteryCapacity, false)
    };
  },

  getBatteryColor: function(summary) {
    if (summary.totalBatteryStored <= 0) {
      return Color.gray;
    }

    if (summary.totalNet > 0 && summary.totalBatteryStored < summary.totalBatteryCapacity) {
      return Color.green;
    }

    if (summary.totalNet < 0) {
      return Color.red;
    }

    return Color.white;
  },

  getNetColor: function(net) {
    if (net > 0) {
      return Color.yellow;
    }

    if (net < 0) {
      return Color.red;
    }

    return Color.gray;
  }
};

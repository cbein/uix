/** @type {PowerFrontend} */
const Common = require("lib/common");

module.exports = {
  config: {
    scale: 1, //size multiplier
    leftMargin: 16, //offset from left
    topMargin: 240, //offset from top
    iconSize: 16, //row icon size
    iconRightPadding: 8, //gap after icon
    valueWidth: 76, //value column width
    rowHeight: 24, //row height
    rowSpacing: 4, //gap between rows
    powerUnitsPerSecond: 60 //ticks to seconds
  },
  powerBackgroundTable: null,
  powerBackend: null,
  powerTable: null,
  previousBatteryStored: null,
  batteryColor: null,
  batteryColorTimer: 0,

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
    powerFrontend.powerBackgroundTable.marginTop(powerFrontend.scaled(config.topMargin + config.rowHeight + config.rowSpacing));
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

    if (!Vars.state.isGame() || summary.networkCount === 0) {
      powerBackgroundTable.clear();
      powerTable.clear();
      powerFrontend.previousBatteryStored = null;
      powerFrontend.batteryColor = null;
      powerFrontend.batteryColorTimer = 0;
      return;
    }

    if (powerFrontend.powerTable.hasMouse()) {
      return;
    }

    powerBackgroundTable.clear();
    powerTable.clear();

    powerTable.add("Power")
      .color(Color.white)
      .left()
      .width(powerFrontend.scaled(powerFrontend.getRowContentWidth()))
      .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
      .padBottom(powerFrontend.scaled(powerFrontend.config.rowSpacing))
      .row();

    powerFrontend.addRowBackground(powerBackgroundTable);
    powerFrontend.addRow(powerTable, Icon.treeSmall, "Networks", Common.formatNumber(summary.networkCount, false), Color.white);
    powerFrontend.addRowBackground(powerBackgroundTable);
    powerFrontend.addPowerRow(powerTable, Icon.powerSmall, "Power", summary.totalNet, powerFrontend.getNetColor(summary.totalNet));
    powerFrontend.addRowBackground(powerBackgroundTable);
    powerFrontend.addBatteryRow(powerTable, Icon.trelloSmall, "Stored", summary, powerFrontend.getBatteryColor(summary));
  },

  addRow: function(powerTable, icon, tooltip, value, valueColor) {
    const powerFrontend = this;

    powerFrontend.addCardRow(powerTable, icon, tooltip, valueColor, valueColor, function(row) {
      powerFrontend.addTextValue(row, "" + value, valueColor);
    });
  },

  addPowerRow: function(powerTable, icon, tooltip, value, valueColor) {
    const powerFrontend = this;
    const power = powerFrontend.formatPower(value);

    powerFrontend.addCardRow(powerTable, icon, tooltip, valueColor, valueColor, function(row) {
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

  addBatteryRow: function(powerTable, icon, tooltip, summary, valueColor) {
    const powerFrontend = this;
    const battery = powerFrontend.formatBattery(summary);

    powerFrontend.addCardRow(powerTable, icon, tooltip, valueColor, valueColor, function(row) {
      row.table(Tex.clear, function(valueTable) {
        valueTable.right();
        powerFrontend.addFormattedNumber(valueTable, battery, valueColor);
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

  addCardRow: function(powerTable, icon, tooltip, iconColor, accentColor, addValue) {
    const powerFrontend = this;
    const accentWidth = powerFrontend.getAccentWidth();
    const config = powerFrontend.config;

    powerTable.table(Tex.clear, function(row) {
      row.left();
      row.touchable = Touchable.enabled;

      row.image(icon)
        .size(powerFrontend.scaled(config.iconSize))
        .color(iconColor)
        .padRight(powerFrontend.scaled(config.iconRightPadding));

      addValue(row);

      row.image(Tex.whiteui)
        .color(accentColor)
        .width(powerFrontend.scaled(accentWidth))
        .height(powerFrontend.scaled(config.rowHeight))
        .padLeft(powerFrontend.scaled(config.iconRightPadding));
    })
      .height(powerFrontend.scaled(config.rowHeight))
      .width(powerFrontend.scaled(powerFrontend.getRowContentWidth()))
      .padBottom(powerFrontend.scaled(config.rowSpacing))
      .tooltip(tooltip)
      .row();
  },

  addRowBackground: function(backgroundTable) {
    const powerFrontend = this;
    const config = powerFrontend.config;

    backgroundTable.image(Styles.black6)
      .height(powerFrontend.scaled(config.rowHeight))
      .width(powerFrontend.scaled(config.leftMargin + powerFrontend.getRowContentWidth()))
      .padBottom(powerFrontend.scaled(config.rowSpacing))
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
    const sign = perSecond > 0 ? "+" : "";

    return {
      amount: sign + split.amount,
      suffix: split.suffix + "/s"
    };
  },

  formatBattery: function(summary) {
    if (summary.totalBatteryCapacity <= 0) {
      return "0";
    }

    return Common.formatNumber(summary.totalBatteryStored, false);
  },

  getBatteryColor: function(summary) {
    const powerFrontend = this;
    const currentStored = summary.totalBatteryStored;
    const previousStored = powerFrontend.previousBatteryStored;
    const colorHoldTicks = 2;

    powerFrontend.previousBatteryStored = currentStored;

    if (previousStored !== null && currentStored > previousStored) {
      powerFrontend.batteryColor = Color.green;
      powerFrontend.batteryColorTimer = colorHoldTicks;
      return powerFrontend.batteryColor;
    }

    if (previousStored !== null && currentStored < previousStored) {
      powerFrontend.batteryColor = Color.red;
      powerFrontend.batteryColorTimer = colorHoldTicks;
      return powerFrontend.batteryColor;
    }

    if (powerFrontend.batteryColorTimer > 0 && powerFrontend.batteryColor !== null) {
      powerFrontend.batteryColorTimer -= Time.delta;
      return powerFrontend.batteryColor;
    }

    if (currentStored <= 0) {
      return Color.gray;
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

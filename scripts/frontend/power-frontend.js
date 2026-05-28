/** @type {PowerFrontend} */
const Common = require("lib/common");

module.exports = {
  config: {
    scale: 1, //size multiplier
    leftMargin: 16, //offset from left
    topMargin: 240, //offset from top
    panelWidth: 244, //panel width
    labelWidth: 116, //label column width
    valueWidth: 104, //value column width
    rowHeight: 24, //row height
    powerUnitsPerSecond: 60 //ticks to seconds
  },
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
    const powerTable = powerFrontend.powerTable;
    const summary = powerFrontend.powerBackend.powerSummary;

    powerTable.clear();

    if (!Vars.state.isGame() || summary.networkCount === 0) {
      return;
    }

    powerTable.add("Power")
      .color(Color.white)
      .left()
      .width(powerFrontend.scaled(powerFrontend.config.panelWidth))
      .padBottom(powerFrontend.scaled(4))
      .row();

    powerFrontend.addRow(powerTable, "Networks", Common.formatNumber(summary.networkCount, false), Color.lightGray);
    powerFrontend.addPowerRow(powerTable, "Production", summary.totalProduction, Color.green);
    powerFrontend.addPowerRow(powerTable, "Consumption", summary.totalConsumption, Color.orange);
    powerFrontend.addPowerRow(powerTable, "Net", summary.totalNet, powerFrontend.getNetColor(summary.totalNet));
    powerFrontend.addRow(powerTable, "Battery", powerFrontend.formatBattery(summary), Color.lightGray);
    powerFrontend.addRow(powerTable, "Satisfaction", Math.round(summary.totalSatisfaction * 100) + "%", Color.lightGray);
  },

  addRow: function(powerTable, label, value, valueColor) {
    const powerFrontend = this;

    powerFrontend.addCardRow(powerTable, label, valueColor, function(row) {
      row.add("" + value)
        .color(valueColor)
        .width(powerFrontend.scaled(powerFrontend.config.valueWidth))
        .padLeft(powerFrontend.scaled(8))
        .right();
    });
  },

  addPowerRow: function(powerTable, label, value, valueColor) {
    const powerFrontend = this;
    const power = powerFrontend.formatPower(value);

    powerFrontend.addCardRow(powerTable, label, valueColor, function(row) {
      row.table(Tex.clear, function(valueTable) {
        valueTable.right();
        valueTable.add(power.amount)
          .color(valueColor)
          .right();

        valueTable.add(power.suffix)
          .color(Color.lightGray)
          .padLeft(powerFrontend.scaled(1))
          .right();
      })
        .width(powerFrontend.scaled(powerFrontend.config.valueWidth))
        .padLeft(powerFrontend.scaled(8))
        .right();
    });
  },

  addCardRow: function(powerTable, label, accentColor, addValue) {
    const powerFrontend = this;
    const accentWidth = 4;
    const rowSpacing = 4;

    powerTable.table(Tex.clear, function(row) {
      row.add(label)
        .color(Color.lightGray)
        .width(powerFrontend.scaled(powerFrontend.config.labelWidth))
        .padRight(powerFrontend.scaled(8))
        .left();

      addValue(row);

      row.image(Tex.whiteui)
        .color(accentColor)
        .width(powerFrontend.scaled(accentWidth))
        .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
        .padLeft(powerFrontend.scaled(8));
    })
      .height(powerFrontend.scaled(powerFrontend.config.rowHeight))
      .width(powerFrontend.scaled(powerFrontend.config.panelWidth))
      .padBottom(powerFrontend.scaled(rowSpacing))
      .row();
  },

  scaled: function(value) {
    return value * this.config.scale;
  },

  formatPower: function(value) {
    const perSecond = value * this.config.powerUnitsPerSecond;
    const formatted = Common.formatNumber(perSecond, false);

    if (formatted.indexOf("mil") >= 0) {
      return {
        amount: formatted.replace("mil", ""),
        suffix: "mil/s"
      };
    }

    if (formatted.indexOf("k") >= 0) {
      return {
        amount: formatted.replace("k", ""),
        suffix: "k/s"
      };
    }

    return {
      amount: formatted,
      suffix: "/s"
    };
  },

  formatBattery: function(summary) {
    if (summary.totalBatteryCapacity <= 0) {
      return "0%";
    }

    return Math.round(summary.totalBatteryStored / summary.totalBatteryCapacity * 100) + "%";
  },

  getNetColor: function(net) {
    const perSecond = net * this.config.powerUnitsPerSecond;

    return Common.scaledColor(perSecond, 1000, 10000, Color.white);
  }
};

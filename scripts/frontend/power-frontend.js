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
    padding: 8, //space around contents
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

    powerTable.table(Tex.button, function(panel) {
      panel.defaults().height(powerFrontend.scaled(powerFrontend.config.rowHeight));

      panel.add("")
        .height(powerFrontend.scaled(powerFrontend.config.padding))
        .colspan(2)
        .row();

      panel.add("Power")
        .color(Color.white)
        .left()
        .colspan(2)
        .padBottom(powerFrontend.scaled(4))
        .row();

      powerFrontend.addRow(panel, "Networks", summary.networkCount, Color.lightGray);
      powerFrontend.addPowerRow(panel, "Production", summary.totalProduction, Color.green);
      powerFrontend.addPowerRow(panel, "Consumption", summary.totalConsumption, Color.orange);
      powerFrontend.addPowerRow(panel, "Net", summary.totalNet, powerFrontend.getNetColor(summary.totalNet));
      powerFrontend.addRow(panel, "Battery", powerFrontend.formatBattery(summary), Color.lightGray);
      powerFrontend.addRow(panel, "Satisfaction", Math.round(summary.totalSatisfaction * 100) + "%", Color.lightGray);

      panel.add("")
        .height(powerFrontend.scaled(powerFrontend.config.padding))
        .colspan(2)
        .row();
    })
      .width(powerFrontend.scaled(powerFrontend.config.panelWidth))
      .pad(powerFrontend.scaled(powerFrontend.config.padding));
  },

  addRow: function(panel, label, value, valueColor) {
    const powerFrontend = this;

    panel.add(label)
      .color(Color.lightGray)
      .width(powerFrontend.scaled(powerFrontend.config.labelWidth))
      .padRight(powerFrontend.scaled(8))
      .left();

    panel.add("" + value)
      .color(valueColor)
      .width(powerFrontend.scaled(powerFrontend.config.valueWidth))
      .padLeft(powerFrontend.scaled(8))
      .right()
      .row();
  },

  addPowerRow: function(panel, label, value, valueColor) {
    const powerFrontend = this;
    const power = powerFrontend.formatPower(value);

    panel.add(label)
      .color(Color.lightGray)
      .width(powerFrontend.scaled(powerFrontend.config.labelWidth))
      .padRight(powerFrontend.scaled(8))
      .left();

    panel.table(Tex.clear, function(valueTable) {
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
      .right()
      .row();
  },

  scaled: function(value) {
    return value * this.config.scale;
  },

  formatPower: function(value) {
    const perSecond = value * this.config.powerUnitsPerSecond;
    const rounded = Math.round(perSecond);
    const sign = rounded < 0 ? "-" : "";
    const amount = Math.abs(rounded);

    if (amount >= 1000000) {
      return {
        amount: sign + Math.round(amount / 1000000),
        suffix: "mil/s"
      };
    }

    if (amount >= 1000) {
      return {
        amount: sign + Math.round(amount / 1000),
        suffix: "k/s"
      };
    }

    return {
      amount: sign + amount,
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

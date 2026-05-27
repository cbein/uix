/** @type {PowerFrontend} */
module.exports = {
  config: {
    scale: 1,
    leftMargin: 16,
    topMargin: 240,
    panelWidth: 244,
    labelWidth: 116,
    valueWidth: 104,
    rowHeight: 24,
    padding: 8,
    powerUnitsPerSecond: 60
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
      powerFrontend.addRow(panel, "Production", powerFrontend.formatPower(summary.totalProduction), Color.green);
      powerFrontend.addRow(panel, "Consumption", powerFrontend.formatPower(summary.totalConsumption), Color.orange);
      powerFrontend.addRow(panel, "Net", powerFrontend.formatPower(summary.totalNet), powerFrontend.getNetColor(summary.totalNet));
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

  scaled: function(value) {
    return value * this.config.scale;
  },

  formatPower: function(value) {
    const perSecond = value * this.config.powerUnitsPerSecond;

    return Math.round(perSecond * 10) / 10 + "/s";
  },

  formatBattery: function(summary) {
    if (summary.totalBatteryCapacity <= 0) {
      return "0%";
    }

    return Math.round(summary.totalBatteryStored / summary.totalBatteryCapacity * 100) + "%";
  },

  getNetColor: function(net) {
    if (net > 0) {
      return Color.green;
    }

    if (net < 0) {
      return Color.red;
    }

    return Color.lightGray;
  }
};

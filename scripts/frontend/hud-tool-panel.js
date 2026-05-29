module.exports = {
  config: {
    rightMargin: 314,
    bottomMargin: 0,
    buttonSize: 50,
    borderSize: 4,
    rowCount: 5,
    iconSize: 24
  },
  panel: null,
  topBorder: null,
  rows: [],
  tools: [
    {
      key: "uix-power-overlay",
      iconName: "power",
      tooltip: "Power overlay",
      color: Color.red
    },
    {
      key: "uix-liquid-overlay",
      iconName: "liquid",
      tooltip: "Liquid overlay",
      color: Color.blue
    },
    {
      key: "uix-graph-tool",
      iconName: "chartBar",
      tooltip: "Graph",
      color: Color.white
    },
    {
      key: "uix-schematic-tool",
      iconName: "fileText",
      tooltip: "Schematic",
      color: Color.white
    },
    {
      key: "uix-info-tool",
      iconName: "infoCircle",
      tooltip: "Information",
      color: Color.white
    }
  ],

  start: function() {
    const hudToolPanel = this;

    Events.on(ClientLoadEvent, function() {
      hudToolPanel.build();
    });
  },

  build: function() {
    const hudToolPanel = this;

    hudToolPanel.panel = new Table();
    hudToolPanel.panel.setFillParent(true);
    hudToolPanel.panel.bottom().right();
    hudToolPanel.panel.marginRight(hudToolPanel.config.rightMargin);
    hudToolPanel.panel.marginBottom(hudToolPanel.config.bottomMargin);
    hudToolPanel.panel.visibility = function() {
      return hudToolPanel.shouldShow();
    };

    hudToolPanel.panel.table(Tex.clear, function(section) {
      hudToolPanel.buildSection(section);
    });

    Vars.ui.hudGroup.addChild(hudToolPanel.panel);

    hudToolPanel.topBorder = new Table();
    hudToolPanel.topBorder.setFillParent(true);
    hudToolPanel.topBorder.bottom().right();
    hudToolPanel.topBorder.marginRight(hudToolPanel.config.rightMargin);
    hudToolPanel.topBorder.marginBottom(hudToolPanel.config.bottomMargin + hudToolPanel.config.buttonSize * hudToolPanel.config.rowCount);
    hudToolPanel.topBorder.visibility = function() {
      return hudToolPanel.shouldShow();
    };
    hudToolPanel.topBorder.image(Tex.whiteui)
      .color(Pal.gray)
      .width(hudToolPanel.config.buttonSize + hudToolPanel.config.borderSize)
      .height(hudToolPanel.config.borderSize);
    Vars.ui.hudGroup.addChild(hudToolPanel.topBorder);

    Events.run(Trigger.update, function() {
      hudToolPanel.updateButtons();
    });
  },

  buildSection: function(section) {
    const hudToolPanel = this;

    section.bottom();
    section.table(Tex.clear, function(body) {
      body.left();
      body.image(Tex.whiteui)
        .color(Pal.gray)
        .width(hudToolPanel.config.borderSize)
        .height(hudToolPanel.config.buttonSize * hudToolPanel.config.rowCount);

      body.table(Styles.black6, function(rows) {
        hudToolPanel.buildRows(rows);
      })
        .width(hudToolPanel.config.buttonSize)
        .height(hudToolPanel.config.buttonSize * hudToolPanel.config.rowCount);
    });
  },

  buildRows: function(section) {
    const hudToolPanel = this;

    section.defaults().size(hudToolPanel.config.buttonSize);
    for (let i = 0; i < hudToolPanel.config.rowCount; i++) {
      if (i < hudToolPanel.tools.length) {
        hudToolPanel.addToolButton(section, hudToolPanel.tools[i]);
      } else {
        hudToolPanel.addEmptySlot(section);
      }
    }
  },

  addToolButton: function(table, tool) {
    const hudToolPanel = this;
    let button = null;
    let image = null;

    button = new Packages.arc.scene.ui.Button(Styles.clearTogglei);
    image = button.image(hudToolPanel.getIcon(tool))
      .size(hudToolPanel.config.iconSize)
      .get();

    button.clicked(function() {
      const enabled = !hudToolPanel.getBool(tool.key);
      hudToolPanel.setBool(tool.key, enabled);
      hudToolPanel.updateButton(button, tool, image);
    });

    table.add(button)
      .size(hudToolPanel.config.buttonSize)
      .tooltip(tool.tooltip);

    hudToolPanel.updateButton(button, tool, image);
    hudToolPanel.rows.push({
      button: button,
      tool: tool,
      image: image
    });

    table.row();
  },

  addEmptySlot: function(table) {
    const hudToolPanel = this;

    table.image(Styles.black6)
      .size(hudToolPanel.config.buttonSize);

    table.row();
  },

  updateButtons: function() {
    const hudToolPanel = this;

    for (let i = 0; i < hudToolPanel.rows.length; i++) {
      hudToolPanel.updateButton(hudToolPanel.rows[i].button, hudToolPanel.rows[i].tool, hudToolPanel.rows[i].image);
    }
  },

  updateButton: function(button, tool, image) {
    const enabled = this.getBool(tool.key);

    button.setChecked(enabled);
    image.setColor(enabled ? tool.color : Color.gray);
  },

  shouldShow: function() {
    return Vars.state.isGame() && !this.isCommandMode();
  },

  isCommandMode: function() {
    return Vars.control != null
      && Vars.control.input != null
      && Vars.control.input.commandMode;
  },

  getIcon: function(tool) {
    if (tool.iconName === "power") {
      return Icon.power;
    }

    if (tool.iconName === "liquid") {
      return Icon.liquid;
    }

    if (tool.iconName === "chartBar") {
      return Icon.chartBar;
    }

    if (tool.iconName === "fileText") {
      return Icon.fileText;
    }

    if (tool.iconName === "infoCircle") {
      return Icon.infoCircle;
    }

    return Icon.grid;
  },

  getBool: function(key) {
    return Core.settings.getBool(key, false);
  },

  setBool: function(key, value) {
    Core.settings.put(key, value);
  }
};

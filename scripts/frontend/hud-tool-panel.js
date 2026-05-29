module.exports = {
  config: {
    rightMargin: 314,
    bottomMargin: -5,
    buttonSize: 46,
    borderSize: 4,
    rowCount: 5,
    iconSize: 22,
    extraHeight: 25
  },
  panel: null,
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
      return Vars.state.isGame();
    };

    hudToolPanel.panel.table(Tex.clear, function(section) {
      hudToolPanel.buildSection(section);
    });

    Vars.ui.hudGroup.addChild(hudToolPanel.panel);

    Events.run(Trigger.update, function() {
      hudToolPanel.updateButtons();
    });
  },

  buildSection: function(section) {
    const hudToolPanel = this;

    section.table(Tex.clear, function(row) {
      row.image(Tex.whiteui)
        .color(Pal.gray)
        .height(hudToolPanel.config.borderSize)
        .growX();
    })
      .width(hudToolPanel.config.buttonSize + hudToolPanel.config.borderSize)
      .height(hudToolPanel.config.borderSize)
      .row();

    section.table(Tex.clear, function(body) {
      body.left();
      body.image(Tex.whiteui)
        .color(Pal.gray)
        .width(hudToolPanel.config.borderSize)
        .height(hudToolPanel.getSectionHeight());

      body.table(Styles.black6, function(rows) {
        rows.top();
        for (let i = 0; i < hudToolPanel.config.rowCount; i++) {
          if (i < hudToolPanel.tools.length) {
            hudToolPanel.addToolButton(rows, hudToolPanel.tools[i]);
          } else {
            hudToolPanel.addEmptySlot(rows);
          }
        }
      })
        .width(hudToolPanel.config.buttonSize)
        .height(hudToolPanel.getSectionHeight());
    });
  },

  addToolButton: function(table, tool) {
    const hudToolPanel = this;
    const row = new Table(Tex.clear);
    const image = row.image(hudToolPanel.getIcon(tool))
      .size(hudToolPanel.config.iconSize)
      .get();

    row.touchable = Touchable.enabled;
    row.clicked(function() {
      const enabled = !hudToolPanel.getBool(tool.key);
      hudToolPanel.setBool(tool.key, enabled);
      hudToolPanel.updateRow(row, tool, image);
    });

    table.add(row)
      .size(hudToolPanel.config.buttonSize)
      .tooltip(tool.tooltip);

    hudToolPanel.updateRow(row, tool, image);
    hudToolPanel.rows.push({
      row: row,
      tool: tool,
      image: image
    });

    table.row();
  },

  addEmptySlot: function(table) {
    const hudToolPanel = this;

    table.table(Tex.clear, function() {})
      .size(hudToolPanel.config.buttonSize);

    table.row();
  },

  updateButtons: function() {
    const hudToolPanel = this;

    for (let i = 0; i < hudToolPanel.rows.length; i++) {
      hudToolPanel.updateRow(hudToolPanel.rows[i].row, hudToolPanel.rows[i].tool, hudToolPanel.rows[i].image);
    }
  },

  updateRow: function(row, tool, image) {
    const enabled = this.getBool(tool.key);

    row.background(enabled ? Styles.flatDown : Tex.clear);
    image.setColor(enabled ? tool.color : Color.gray);
  },

  getIcon: function(tool) {
    if (tool.iconName === "power") {
      return Icon.power;
    }

    if (tool.iconName === "liquid") {
      return Icon.liquid;
    }

    return Icon.grid;
  },

  getSectionHeight: function() {
    return this.config.buttonSize * this.config.rowCount + this.config.extraHeight;
  },

  getBool: function(key) {
    return Core.settings.getBool(key, false);
  },

  setBool: function(key, value) {
    Core.settings.put(key, value);
  }
};

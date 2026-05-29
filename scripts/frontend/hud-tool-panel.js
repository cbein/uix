module.exports = {
  config: {
    enabled: true,
    rightMargin: 0,
    bottomMargin: 0,
    buttonSize: 50,
    borderSize: 4,
    rowCount: 5,
    iconSize: 24
  },
  container: null,
  topBorder: null,
  buildMenuField: null,
  buildMenuLookupFailed: false,
  rows: [],
  tools: [
    {
      key: "uix-power-overlay",
      icon: function() { return Icon.power; },
      tooltip: "Power overlay",
      color: Color.red
    },
    {
      key: "uix-liquid-overlay",
      icon: function() { return Icon.liquid; },
      tooltip: "Liquid overlay",
      color: Color.blue
    },
    {
      key: "uix-graph-tool",
      icon: function() { return Icon.chartBar; },
      tooltip: "Graph",
      color: Color.white
    },
    {
      key: "uix-schematic-tool",
      icon: function() { return Icon.fileText; },
      tooltip: "Schematic",
      color: Color.white
    },
    {
      key: "uix-info-tool",
      icon: function() { return Icon.infoCircle; },
      tooltip: "Information",
      color: Color.white
    }
  ],

  start: function() {
    const hudToolPanel = this;

    if (!hudToolPanel.config.enabled) {
      return;
    }

    Events.on(ClientLoadEvent, function() {
      hudToolPanel.build();
    });
  },

  build: function() {
    const hudToolPanel = this;

    //main container for column next to the build menu
    hudToolPanel.container = new Table();
    hudToolPanel.container.setFillParent(true);
    hudToolPanel.container.bottom().right();
    hudToolPanel.container.marginRight(hudToolPanel.config.rightMargin);
    hudToolPanel.container.marginBottom(hudToolPanel.config.bottomMargin);
    hudToolPanel.container.visibility = function() {
      return hudToolPanel.shouldShow();
    };

    //build the sections and add to container
    const section = new Table(Tex.clear);
    hudToolPanel.buildSection(section);
    hudToolPanel.container.add(section);

    //add to the hud group, so it is drawn in game
    Vars.ui.hudGroup.addChild(hudToolPanel.container);

    //add top border to match the vanilla build menu edge
    hudToolPanel.topBorder = new Table();
    hudToolPanel.topBorder.setFillParent(true);
    hudToolPanel.topBorder.bottom().right();
    hudToolPanel.topBorder.marginRight(hudToolPanel.config.rightMargin);
    hudToolPanel.topBorder.marginBottom(hudToolPanel.config.bottomMargin + hudToolPanel.config.buttonSize * hudToolPanel.config.rowCount);
    hudToolPanel.topBorder.visibility = function() {
      return hudToolPanel.shouldShow();
    };

    //draw the border as a gray line matching the build menu edge
    hudToolPanel.topBorder.image(Tex.whiteui)
      .color(Pal.gray)
      .width(hudToolPanel.config.buttonSize + hudToolPanel.config.borderSize)
      .height(hudToolPanel.config.borderSize);

    //add to the hud group, so it is drawn in game
    Vars.ui.hudGroup.addChild(hudToolPanel.topBorder);

    Events.run(Trigger.update, function() {
      //shift the vanilla build menu left so this column can sit on its right
      const buildMenu = hudToolPanel.getBuildMenu();
      if (buildMenu != null) {
        buildMenu.marginRight(hudToolPanel.shouldShow() ? hudToolPanel.config.buttonSize + hudToolPanel.config.borderSize : 0);
      }

      //settings can change outside this panel, so refresh active colors every tick
      for (let i = 0; i < hudToolPanel.rows.length; i++) {
        hudToolPanel.updateButton(hudToolPanel.rows[i].button, hudToolPanel.rows[i].tool, hudToolPanel.rows[i].image);
      }
    });
  },

  buildSection: function(section) {
    const hudToolPanel = this;

    //grey stripe plus black button column
    section.bottom();

    const body = new Table(Tex.clear);
    body.left();

    body.image(Tex.whiteui)
      .color(Pal.gray)
      .width(hudToolPanel.config.borderSize)
      .height(hudToolPanel.config.buttonSize * hudToolPanel.config.rowCount);

    const rows = new Table(Styles.black6);
    hudToolPanel.buildRows(rows);
    body.add(rows)
      .width(hudToolPanel.config.buttonSize)
      .height(hudToolPanel.config.buttonSize * hudToolPanel.config.rowCount);

    section.add(body);
  },

  buildRows: function(section) {
    const hudToolPanel = this;

    section.defaults().size(hudToolPanel.config.buttonSize);
    for (let i = 0; i < hudToolPanel.config.rowCount; i++) {
      if (i < hudToolPanel.tools.length) {
        hudToolPanel.addToolButton(section, hudToolPanel.tools[i]);
      } else {
        //empty slots keep the column height fixed if we add fewer tools later
        section.image(Styles.black6)
          .size(hudToolPanel.config.buttonSize);

        section.row();
      }
    }
  },

  addToolButton: function(table, tool) {
    const hudToolPanel = this;

    const button = new Packages.arc.scene.ui.Button(Styles.clearTogglei);
    const image = button.image(tool.icon())
      .size(hudToolPanel.config.iconSize)
      .get();

    button.clicked(function() {
      //buttons store their own enabled state in settings
      const enabled = !Core.settings.getBool(tool.key, false);
      Core.settings.put(tool.key, enabled);
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

  updateButton: function(button, tool, image) {
    const enabled = Core.settings.getBool(tool.key, false);

    button.setChecked(enabled);
    image.setColor(enabled ? tool.color : Color.gray);
  },

  getBuildMenu: function() {
    if (this.buildMenuLookupFailed) {
      return null;
    }

    if (Vars.ui == null || Vars.ui.hudfrag == null || Vars.ui.hudfrag.blockfrag == null) {
      return null;
    }

    try {
      if (this.buildMenuField == null) {
        this.buildMenuField = Vars.ui.hudfrag.blockfrag.getClass().getDeclaredField("toggler");
        this.buildMenuField.setAccessible(true);
      }

      return this.buildMenuField.get(Vars.ui.hudfrag.blockfrag);
    } catch (error) {
      this.buildMenuLookupFailed = true;
      Log.err("UIX: could not find the Mindustry build menu wrapper: @", error);
      return null;
    }
  },

  shouldShow: function() {
    //when pressing shift (i.e., commandMode), the build menu is replaced with
    //units menu, so we hide this panel when pressing shift
    return Vars.state.isGame()
      && !(Vars.control != null
        && Vars.control.input != null
        && Vars.control.input.commandMode);
  }
};

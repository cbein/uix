module.exports = {
  dialog: null,
  config: {
    buttonWidth: 210,
    buttonHeight: 64,
    optionWidth: 320,
    optionHeight: 56
  },
  pauseButtonName: "uix-pause-button",
  settings: [
    {
      key: "uix-power-panel",
      text: "Power panel"
    },
    {
      key: "uix-resource-rate-panel",
      text: "Resource rate panel"
    }
  ],

  start: function() {
    const uixMenu = this;

    Events.on(ClientLoadEvent, function() {
      uixMenu.buildDialog();
      uixMenu.addSettingsCategory();
      uixMenu.addPauseButton();
      Vars.ui.paused.shown(function() {
        uixMenu.addPauseButton();
      });
    });
  },

  buildDialog: function() {
    const uixMenu = this;

    uixMenu.dialog = new Packages.mindustry.ui.dialogs.BaseDialog("UIX");
    uixMenu.dialog.cont.margin(14);
    uixMenu.dialog.cont.table(Tex.button, function(table) {
      table.defaults()
        .left()
        .width(uixMenu.config.optionWidth)
        .height(uixMenu.config.optionHeight);

      for (let i = 0; i < uixMenu.settings.length; i++) {
        uixMenu.addToggle(table, uixMenu.settings[i]);
      }
    });
    uixMenu.dialog.addCloseButton();
  },

  addSettingsCategory: function() {
    const uixMenu = this;

    Vars.ui.settings.addCategory("UIX", Icon.grid, function(table) {
      table.defaults()
        .left()
        .width(uixMenu.config.optionWidth)
        .height(uixMenu.config.optionHeight);

      for (let i = 0; i < uixMenu.settings.length; i++) {
        uixMenu.addToggle(table, uixMenu.settings[i]);
      }
    });
  },

  addPauseButton: function() {
    const uixMenu = this;

    if (Vars.ui.paused.find(uixMenu.pauseButtonName) !== null) {
      return;
    }

    Vars.ui.paused.buttons.row();
    const button = Vars.ui.paused.buttons.button("UIX", Icon.grid, function() {
      uixMenu.dialog.show();
    })
      .size(uixMenu.config.buttonWidth, uixMenu.config.buttonHeight)
      .get();

    button.name = uixMenu.pauseButtonName;
  },

  addToggle: function(table, setting) {
    const uixMenu = this;

    table.table(Tex.clear, function(row) {
      row.left();
      const check = row.check(setting.text, uixMenu.getBool(setting.key), function(checked) {
        Core.settings.put(setting.key, checked);
      })
        .left()
        .get();

      check.getLabel().setAlignment(Align.left);
    })
      .left()
      .fillX()
      .height(uixMenu.config.optionHeight)
      .padLeft(0)
      .left()
      .row();
  },

  getBool: function(key) {
    return Core.settings.getBool(key, true);
  }
};

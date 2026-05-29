/** @type {LiquidToolBackend} */
module.exports = {
  settingsKey: "uix-liquid-overlay",
  powerSettingsKey: "uix-power-overlay",
  config: {
    statusZ: 71,
    tileSize: 8,
    iconSize: 6,
    iconSpacing: 6,
    smallBlockScale: 0.64
  },

  start: function() {
    const liquidToolBackend = this;

    Events.run(Trigger.draw, function() {
      if (!liquidToolBackend.isEnabled()) {
        return;
      }

      const team = liquidToolBackend.getCurrentTeam();

      if (team == null) {
        return;
      }

      const teamData = Vars.state.teams.get(team);

      if (teamData == null) {
        return;
      }

      liquidToolBackend.drawMissingLiquid(teamData, team);
    });
  },

  drawMissingLiquid: function(teamData, team) {
    const liquidToolBackend = this;
    const previousZ = Draw.z();

    Draw.z(liquidToolBackend.config.statusZ);

    teamData.buildings.each(function(building) {
      if (!liquidToolBackend.shouldDraw(building, team)) {
        return;
      }

      liquidToolBackend.drawLiquidIcon(building);
    });

    Draw.z(previousZ);
    Draw.color();
  },

  shouldDraw: function(building, team) {
    if (building == null
      || !building.isValid()
      || building.inFogTo(team)
      || building.block == null
      || building.liquids == null
      || !building.block.hasLiquids) {
      return false;
    }

    return building.liquids.currentAmount() <= 0.01;
  },

  drawLiquidIcon: function(building) {
    const liquidToolBackend = this;
    const scale = building.block.size > 1 ? 1 : liquidToolBackend.config.smallBlockScale;
    const topRightX = building.x
      + building.block.size * liquidToolBackend.config.tileSize / 2
      - liquidToolBackend.config.tileSize * scale / 2;
    const iconY = building.y
      + building.block.size * liquidToolBackend.config.tileSize / 2
      - liquidToolBackend.config.tileSize * scale / 2;
    const iconX = liquidToolBackend.shouldOffsetForPower(building)
      ? topRightX - liquidToolBackend.config.iconSpacing * scale
      : topRightX;
    const iconSize = liquidToolBackend.config.iconSize * scale;
    const iconRegion = Icon.liquidSmall.getRegion();
    const iconWidth = iconRegion.width > iconRegion.height
      ? iconSize
      : iconSize * iconRegion.width / iconRegion.height;
    const iconHeight = iconRegion.height > iconRegion.width
      ? iconSize
      : iconSize * iconRegion.height / iconRegion.width;

    Draw.color(Color.blue);
    Draw.rect(iconRegion, iconX, iconY, iconWidth, iconHeight);
  },

  shouldOffsetForPower: function(building) {
    return Core.settings.getBool(this.powerSettingsKey, false)
      && building.power != null
      && building.block.consumesPower
      && building.power.status < 0.99;
  },

  isEnabled: function() {
    return Vars.state.isGame() && Core.settings.getBool(this.settingsKey, false);
  },

  getCurrentTeam: function() {
    if (Vars.player == null || Vars.player.team() == null) {
      return null;
    }

    return Vars.player.team();
  }
};

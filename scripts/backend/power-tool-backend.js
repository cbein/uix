/** @type {PowerToolBackend} */
module.exports = {
  settingsKey: "uix-power-overlay",
  config: {
    statusZ: 71,
    tileSize: 8,
    iconSize: 6,
    smallBlockScale: 0.64
  },

  start: function() {
    const powerToolBackend = this;

    Events.run(Trigger.draw, function() {
      if (!powerToolBackend.isEnabled()) {
        return;
      }

      const team = powerToolBackend.getCurrentTeam();

      if (team == null) {
        return;
      }

      const teamData = Vars.state.teams.get(team);

      if (teamData == null) {
        return;
      }

      powerToolBackend.drawMissingPower(teamData, team);
    });
  },

  drawMissingPower: function(teamData, team) {
    const powerToolBackend = this;
    const previousZ = Draw.z();

    Draw.z(powerToolBackend.config.statusZ);

    teamData.buildings.each(function(building) {
      if (!powerToolBackend.shouldDraw(building, team)) {
        return;
      }

      powerToolBackend.drawPowerIcon(building);
    });

    Draw.z(previousZ);
    Draw.color();
  },

  shouldDraw: function(building, team) {
    return building != null
      && building.isValid()
      && !building.inFogTo(team)
      && building.block != null
      && building.block.consumesPower
      && building.power != null
      && building.power.status < 0.99;
  },

  drawPowerIcon: function(building) {
    const powerToolBackend = this;
    const scale = building.block.size > 1 ? 1 : powerToolBackend.config.smallBlockScale;
    const iconX = building.x
      + building.block.size * powerToolBackend.config.tileSize / 2
      - powerToolBackend.config.tileSize * scale / 2;
    const iconY = building.y
      + building.block.size * powerToolBackend.config.tileSize / 2
      - powerToolBackend.config.tileSize * scale / 2;
    const iconSize = powerToolBackend.config.iconSize * scale;

    Draw.color(Color.red);
    Draw.rect(Core.atlas.find("uix-power-alert"), iconX, iconY, iconSize, iconSize);
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

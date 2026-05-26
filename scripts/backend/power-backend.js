/** @type {PowerBackend} */
module.exports = {
  ticksPerSample: 2,
  timer: 0,
  debugLogTimer: 0,
  currentTeam: null,
  powerNetworks: new Packages.arc.struct.ObjectMap(),
  powerSummary: {
    networkCount: 0,
    totalProduction: 0,
    totalConsumption: 0,
    totalNet: 0,
    totalBatteryRate: 0,
    totalBatteryStored: 0,
    totalBatteryCapacity: 0,
    totalSatisfaction: 0
  },

  start: function() {
    const powerBackend = this;

    Events.run(Trigger.update, function() {
      if (!Vars.state.isGame()) {
        powerBackend.reset();
        return;
      }

      const team = powerBackend.getCurrentTeam();

      if (team == null) {
        powerBackend.reset();
        return;
      }

      if (powerBackend.currentTeam !== team) {
        powerBackend.reset();
        powerBackend.currentTeam = team;
      }

      powerBackend.timer += Time.delta;

      if (powerBackend.timer < powerBackend.ticksPerSample) {
        return;
      }

      const elapsedSeconds = powerBackend.timer / 60;
      powerBackend.timer = 0;
      powerBackend.sample(team, elapsedSeconds);
    });
  },

  reset: function() {
    const powerBackend = this;

    powerBackend.timer = 0;
    powerBackend.debugLogTimer = 0;
    powerBackend.currentTeam = null;
    powerBackend.powerNetworks = new Packages.arc.struct.ObjectMap();
    powerBackend.powerSummary = {
      networkCount: 0,
      totalProduction: 0,
      totalConsumption: 0,
      totalNet: 0,
      totalBatteryRate: 0,
      totalBatteryStored: 0,
      totalBatteryCapacity: 0,
      totalSatisfaction: 0
    };
  },

  getCurrentTeam: function() {
    if (Vars.player == null || Vars.player.team() == null) {
      return null;
    }

    return Vars.player.team();
  },

  sample: function(team, elapsedSeconds) {
    const powerBackend = this;
    const teamData = Vars.state.teams.get(team);

    if (teamData == null) {
      powerBackend.reset();
      return;
    }

    const networks = new Packages.arc.struct.ObjectMap();
    const summary = {
      networkCount: 0,
      totalProduction: 0,
      totalConsumption: 0,
      totalNet: 0,
      totalBatteryRate: 0,
      totalBatteryStored: 0,
      totalBatteryCapacity: 0,
      totalSatisfaction: 0
    };

    //TODO: Right now, we are looping through all building, we can revamp this later to avoid looping through
    //all building by skipping building that don't have power inputs/outputs (e.g., conveyors, etc...)
    teamData.buildings.each(function(building) {
      if (building == null || !building.isValid() || building.power == null || building.power.graph == null) {
        return;
      }

      const graph = building.power.graph;
      const graphId = graph.getID();

      //skip graphs we have already sampled
      if (networks.containsKey(graphId)) {
        return;
      }

      //skip any graph without buildings producing/storing power
      if (graph.producers.size === 0 && graph.batteries.size === 0) {
        return;
      }

      //map betwen graph ids/stats
      const network = powerBackend.createNetworkStats(graph, elapsedSeconds);

      networks.put(graphId, network);
    });

    networks.each(function(graphId, network) {
      summary.networkCount += 1;
      summary.totalProduction += network.production;
      summary.totalConsumption += network.consumption;
      summary.totalNet += network.net;
      summary.totalBatteryRate += network.batteryRate;
      summary.totalBatteryStored += network.batteryStored;
      summary.totalBatteryCapacity += network.batteryCapacity;
      summary.totalSatisfaction += network.satisfaction;
    });

    if (summary.networkCount > 0) {
      summary.totalSatisfaction = summary.totalSatisfaction / summary.networkCount;
    }

    powerBackend.powerNetworks = networks;
    powerBackend.powerSummary = summary;

    powerBackend.debugLogTimer += Time.delta;

    if (powerBackend.debugLogTimer < 60) {
      return;
    }

    powerBackend.debugLogTimer = 0;

    Log.info("");
    Log.info(
      "[Power] networks=" + summary.networkCount +
      " production=" + summary.totalProduction.toFixed(2) +
      " consumption=" + summary.totalConsumption.toFixed(2) +
      " net=" + summary.totalNet.toFixed(2) +
      " batteryRate=" + summary.totalBatteryRate.toFixed(2) +
      " batteryStored=" + summary.totalBatteryStored.toFixed(2) +
      " batteryCapacity=" + summary.totalBatteryCapacity.toFixed(2) +
      " satisfaction=" + summary.totalSatisfaction.toFixed(2)
    );

    networks.each(function(graphId, network) {
      Log.info(
        "[Power] graph=" + graphId +
        " production=" + network.production.toFixed(2) +
        " consumption=" + network.consumption.toFixed(2) +
        " net=" + network.net.toFixed(2) +
        " batteryRate=" + network.batteryRate.toFixed(2) +
        " batteryStored=" + network.batteryStored.toFixed(2) +
        " batteryCapacity=" + network.batteryCapacity.toFixed(2) +
        " batteryCharge=" + network.batteryCharge.toFixed(2) +
        " satisfaction=" + network.satisfaction.toFixed(2)
      );
    });
  },

  createNetworkStats: function(graph, elapsedSeconds) {
    const production = graph.getPowerProduced(); //power being produce by all buildings in the graph, not accounting for battery input/output
    const consumption = graph.getPowerNeeded(); //power being drawn from all buildings in the graph
    const net = graph.getPowerBalance(); //raw generator output minus consumption, not accounting for battery input/output
    const batteryRate = Math.max(0, graph.getLastPowerProduced() - production); //raw generator output plus any battery power the graph had to add to cover shortfall
    const batteryStored = graph.getBatteryStored();
    const batteryCapacity = graph.getTotalBatteryCapacity();
    const satisfaction = graph.getSatisfaction();
    const batteryCharge = batteryCapacity > 0 ? batteryStored / batteryCapacity : 0;

    return {
      graphId: graph.getID(),
      elapsedSeconds: elapsedSeconds,
      production: production,
      consumption: consumption,
      net: net,
      batteryRate: batteryRate,
      batteryStored: batteryStored,
      batteryCapacity: batteryCapacity,
      batteryCharge: batteryCharge,
      satisfaction: satisfaction
    };
  }
};

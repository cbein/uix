/** @type {ItemRateBackend} */
const Common = require("lib/common");

module.exports = {
  ticksPerSecond: 60,
  ticksPerSample: 1,
  timer: 0,
  currentCore: null, //needed to handle reset moving between sectors
  previousStoredAmounts: {},
  previousSpoofedAmounts: {},
  rateHistory: {},
  h1LengthSeconds: 0.5, //seconds of history used for /s display
  h2LengthSeconds: 1, //seconds of history used for /m display
  itemsSeenInCore: {},
  itemStats: [],

  start: function() {
    const itemRateBackend = this;

    Events.run(Trigger.update, function() {
      if (!Vars.state.isGame()) {
        itemRateBackend.reset();
        return;
      }

      const core = itemRateBackend.getCore();

      if (core == null) {
        itemRateBackend.reset();
        return;
      }

      if (itemRateBackend.currentCore !== core) {
        itemRateBackend.reset();
        itemRateBackend.currentCore = core;
        itemRateBackend.initializeCore(core);
      }

      itemRateBackend.timer += Time.delta;

      if (itemRateBackend.timer < itemRateBackend.ticksPerSample) {
        return;
      }

      const elapsedSeconds = itemRateBackend.timer / itemRateBackend.ticksPerSecond;
      itemRateBackend.timer = 0;
      itemRateBackend.sampleCore(core, elapsedSeconds);
    });
  },

  reset: function() {
    const itemRateBackend = this;
    itemRateBackend.timer = 0;
    itemRateBackend.currentCore = null;
    itemRateBackend.previousStoredAmounts = {};
    itemRateBackend.previousSpoofedAmounts = {};
    itemRateBackend.rateHistory = {};
    itemRateBackend.itemsSeenInCore = {};
    itemRateBackend.itemStats = [];
  },

  getCore: function() {
    if (Vars.player == null || Vars.player.team() == null) {
      return null;
    }

    return Vars.player.team().core();
  },

  initializeCore: function(core) {
    const itemRateBackend = this;
    const currentStoredAmounts = {};
    const currentSpoofedAmounts = {};
    const itemStats = [];
    const itemCapacity = core.storageCapacity;

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);
      const spoofedAmount = itemRateBackend.getSpoofedAmount(item);

      if (amount === 0) {
        return;
      }

      itemRateBackend.itemsSeenInCore[item.name] = true;
      currentStoredAmounts[item.name] = amount;
      currentSpoofedAmounts[item.name] = spoofedAmount;

      //the rate history is used to smoothing where the second and minute windows are used for the per 
      //second and per minute displays, respectively.
      itemRateBackend.rateHistory[item.name] = {h1: [], h2: []};
      
      itemStats.push({
        item: item,
        amount: amount,
        isFull: amount >= itemCapacity,
        netRatePerSecond: 0,
        netRatePerMinute: 0
      });
    });

    itemRateBackend.previousStoredAmounts = currentStoredAmounts;
    itemRateBackend.previousSpoofedAmounts = currentSpoofedAmounts;
    itemRateBackend.itemStats = itemStats;
  },

  sampleCore: function(core, elapsedSeconds) {
    const itemRateBackend = this;

    const currentStoredAmounts = {};
    const currentSpoofedAmounts = {};
    const itemStats = [];
    const itemCapacity = core.storageCapacity;

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);
      const spoofedAmount = itemRateBackend.getSpoofedAmount(item);

      let previousAmount = itemRateBackend.previousStoredAmounts[item.name];
      let previousSpoofedAmount = itemRateBackend.previousSpoofedAmounts[item.name];

      //if we don't have previous amount, assume equals zero
      if (previousAmount === undefined) {
        previousAmount = 0;
      }

      if (previousSpoofedAmount === undefined) {
        previousSpoofedAmount = spoofedAmount;
      }

      //we render rates for all items that has appeared in the core
      if (amount > 0 || spoofedAmount > previousSpoofedAmount) {
        itemRateBackend.itemsSeenInCore[item.name] = true;
      }

      //we skip items that has never been in the core to avoid clutter
      if (amount === 0 && !itemRateBackend.itemsSeenInCore[item.name]) {
        return;
      }

      const isFull = amount >= itemCapacity;
      const netRate = (amount - previousAmount) / elapsedSeconds;
      const incomingRate = (spoofedAmount - previousSpoofedAmount) / elapsedSeconds;
      const rate = isFull ? incomingRate : netRate;
      const averageRates = itemRateBackend.sample(item.name, rate);

      currentStoredAmounts[item.name] = amount;
      currentSpoofedAmounts[item.name] = spoofedAmount;

      itemStats.push({
        item: item,
        amount: amount,
        isFull: isFull,
        netRatePerSecond: averageRates.perSecond,
        netRatePerMinute: averageRates.perMinute
      });
    });

    itemRateBackend.previousStoredAmounts = currentStoredAmounts;
    itemRateBackend.previousSpoofedAmounts = currentSpoofedAmounts;
    itemRateBackend.itemStats = itemStats;
  },

  getSpoofedAmount: function(item) {
    return Vars.state.stats.coreItemCount.get(item, 0);
  },

  sample: function(itemName, rate) {
    const itemRateBackend = this;
    let rateHistory = itemRateBackend.rateHistory[itemName];

    if (rateHistory === undefined) {
      rateHistory = {h1: [], h2: []};
      itemRateBackend.rateHistory[itemName] = rateHistory;
    }

    //the length of sampling window is length*(ticks/s)/(ticks/sample))
    const lengthToSamples = function(lengthSeconds) {
      return Math.max(1, Math.round(lengthSeconds * itemRateBackend.ticksPerSecond / itemRateBackend.ticksPerSample));
    };
    const h1LengthSamples = lengthToSamples(itemRateBackend.h1LengthSeconds);
    const h2LengthSamples = lengthToSamples(itemRateBackend.h2LengthSeconds);

    rateHistory.h1.push(rate); //h1 is reported as per second in ui
    rateHistory.h2.push(rate * 60); //h2 is reported as per minute in ui

    if (rateHistory.h1.length > h1LengthSamples) {
      rateHistory.h1.shift(); //removes first element of array
    }

    if (rateHistory.h2.length > h2LengthSamples) {
      rateHistory.h2.shift(); //removes first element of array
    }

    return {
      perSecond: Common.average(rateHistory.h1),
      perMinute: Common.average(rateHistory.h2)
    };
  }
};

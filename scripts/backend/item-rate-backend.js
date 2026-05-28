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
  historyLengthSeconds: 0.5, //seconds of history used for /s display
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

      //the rate history is used to smooth the per second display.
      itemRateBackend.rateHistory[item.name] = [];
      
      itemStats.push({
        item: item,
        amount: amount,
        isFull: amount >= itemCapacity,
        netRatePerSecond: 0
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
      const averageRate = itemRateBackend.sample(item.name, rate);

      currentStoredAmounts[item.name] = amount;
      currentSpoofedAmounts[item.name] = spoofedAmount;

      itemStats.push({
        item: item,
        amount: amount,
        isFull: isFull,
        netRatePerSecond: averageRate
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
      rateHistory = [];
      itemRateBackend.rateHistory[itemName] = rateHistory;
    }

    //the length of sampling window is length*(ticks/s)/(ticks/sample))
    const lengthToSamples = function(lengthSeconds) {
      return Math.max(1, Math.round(lengthSeconds * itemRateBackend.ticksPerSecond / itemRateBackend.ticksPerSample));
    };
    const historyLengthSamples = lengthToSamples(itemRateBackend.historyLengthSeconds);

    rateHistory.push(rate);

    if (rateHistory.length > historyLengthSamples) {
      rateHistory.shift(); //removes first element of array
    }

    return Common.average(rateHistory);
  }
};

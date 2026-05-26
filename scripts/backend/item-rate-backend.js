/** @type {ItemRateBackend} */
module.exports = {
  ticksPerSample: 2,
  timer: 0,
  currentCore: null, //needed to handle reset moving between sectors
  previousStoredAmounts: {},
  rateHistory: {},
  perSecondWindow: 0.5, // seconds of history used for /s display
  perMinuteWindow: 10, // seconds of history used for /m display
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

      const elapsedSeconds = itemRateBackend.timer / 60;
      itemRateBackend.timer = 0;
      itemRateBackend.sample(core, elapsedSeconds);
    });
  },

  reset: function() {
    const itemRateBackend = this;
    itemRateBackend.timer = 0;
    itemRateBackend.currentCore = null;
    itemRateBackend.previousStoredAmounts = {};
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
    const itemStats = [];
    const itemCapacity = core.block.itemCapacity;

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);

      if (amount === 0) {
        return;
      }

      itemRateBackend.itemsSeenInCore[item.name] = true;
      currentStoredAmounts[item.name] = amount;
      itemRateBackend.rateHistory[item.name] = {second: [], minute: []};
      itemStats.push({
        item: item,
        amount: amount,
        isFull: amount >= itemCapacity,
        netRatePerSecond: 0,
        netRatePerMinute: 0
      });
    });

    itemRateBackend.previousStoredAmounts = currentStoredAmounts;
    itemRateBackend.itemStats = itemStats;
  },

  sample: function(core, elapsedSeconds) {
    const itemRateBackend = this;

    const currentStoredAmounts = {};
    const itemStats = [];
    const itemCapacity = core.block.itemCapacity;

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);

      let previousAmount = itemRateBackend.previousStoredAmounts[item.name];

      // if we don't have previous amount, assume equals zero
      if (previousAmount === undefined) {
        previousAmount = 0;
      }

      // we render rates for all items that has appeared in the core
      if (amount > 0) {
        itemRateBackend.itemsSeenInCore[item.name] = true;
      }

      // we skip items that has never been in the core to avoid clutter as there are many irrelevant items
      if (amount === 0 && !itemRateBackend.itemsSeenInCore[item.name]) {
        return;
      }

      const isFull = amount >= itemCapacity;
      const rate = (amount - previousAmount) / elapsedSeconds;
      const averageRates = itemRateBackend.addRateSample(item.name, rate);

      currentStoredAmounts[item.name] = amount;

      itemStats.push({
        item: item,
        amount: amount,
        isFull: isFull,
        netRatePerSecond: averageRates.perSecond,
        netRatePerMinute: averageRates.perMinute
      });
    });

    itemRateBackend.previousStoredAmounts = currentStoredAmounts;
    itemRateBackend.itemStats = itemStats;
  },

  addRateSample: function(itemName, ratePerSecond) {
    const itemRateBackend = this;
    let samplesByWindow = itemRateBackend.rateHistory[itemName];

    if (samplesByWindow === undefined) {
      samplesByWindow = {second: [], minute: []};
      itemRateBackend.rateHistory[itemName] = samplesByWindow;
    }

    return itemRateBackend.addRateToWindows(samplesByWindow, ratePerSecond);
  },

  addRateToWindows: function(samplesByWindow, ratePerSecond) {
    const itemRateBackend = this;

    return {
      perSecond: itemRateBackend.addSampleToWindow(
        samplesByWindow.second,
        ratePerSecond,
        itemRateBackend.getMaxSamples(itemRateBackend.perSecondWindow)
      ),
      perMinute: itemRateBackend.addSampleToWindow(
        samplesByWindow.minute,
        ratePerSecond * 60,
        itemRateBackend.getMaxSamples(itemRateBackend.perMinuteWindow)
      )
    };
  },

  addSampleToWindow: function(samples, rate, maxSamples) {
    samples.push(rate);

    if (samples.length > maxSamples) {
      samples.shift();
    }

    return this.averageSamples(samples);
  },

  averageSamples: function(samples) {
    if (samples.length === 0) {
      return 0;
    }

    let total = 0;

    for (let i = 0; i < samples.length; i++) {
      total += samples[i];
    }

    return total / samples.length;
  },

  getMaxSamples: function(averageSeconds) {
    return Math.max(1, Math.round(averageSeconds * 60 / this.ticksPerSample));
  }
};

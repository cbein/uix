/** @type {ItemRateBackend} */
module.exports = {
  ticksPerSample: 2,
  timer: 0,
  currentCore: null, //needed to handle reset moving between sectors
  previousItems: {},
  previousCoreItemCounts: {},
  rateSamples: {},
  secondAverageSeconds: 0.5,
  minuteAverageSeconds: 10,
  knownItems: {},
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
    itemRateBackend.previousItems = {};
    itemRateBackend.previousCoreItemCounts = {};
    itemRateBackend.rateSamples = {};
    itemRateBackend.knownItems = {};
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
    const current = {};
    const currentCoreItemCounts = {};
    const itemStats = [];
    const itemCapacity = core.block.itemCapacity;

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);
      const coreItemCount = itemRateBackend.getCoreItemCount(item);

      if (amount === 0) {
        return;
      }

      itemRateBackend.knownItems[item.name] = true;
      current[item.name] = amount;
      currentCoreItemCounts[item.name] = coreItemCount;
      itemRateBackend.rateSamples[item.name] = itemRateBackend.createRateSampleWindows();
      itemStats.push({
        item: item,
        amount: amount,
        isFull: amount >= itemCapacity,
        incomingRatePerSecond: 0,
        incomingRatePerMinute: 0,
        spendingRatePerSecond: 0,
        spendingRatePerMinute: 0,
        netRatePerSecond: 0,
        netRatePerMinute: 0
      });
    });

    itemRateBackend.previousItems = current;
    itemRateBackend.previousCoreItemCounts = currentCoreItemCounts;
    itemRateBackend.itemStats = itemStats;
  },

  sample: function(core, elapsedSeconds) {
    const itemRateBackend = this;

    const current = {};
    const currentCoreItemCounts = {};
    const itemStats = [];
    const itemCapacity = core.block.itemCapacity;

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);
      const coreItemCount = itemRateBackend.getCoreItemCount(item);

      let previousAmount = itemRateBackend.previousItems[item.name];
      let previousCoreItemCount = itemRateBackend.previousCoreItemCounts[item.name];

      if (previousAmount === undefined) {
        previousAmount = 0;
      }

      if (previousCoreItemCount === undefined) {
        previousCoreItemCount = coreItemCount;
      }

      const incomingAmount = coreItemCount - previousCoreItemCount;

      if (amount > 0 || incomingAmount > 0) {
        itemRateBackend.knownItems[item.name] = true;
      }

      if (amount === 0 && !itemRateBackend.knownItems[item.name]) {
        return;
      }

      const isFull = amount >= itemCapacity;
      const rates = itemRateBackend.getItemRatesPerSecond(amount, previousAmount, incomingAmount, elapsedSeconds);
      const averageRates = itemRateBackend.addRateSample(item.name, rates);

      current[item.name] = amount;
      currentCoreItemCounts[item.name] = coreItemCount;

      itemStats.push({
        item: item,
        amount: amount,
        isFull: isFull,
        incomingRatePerSecond: averageRates.incoming.perSecond,
        incomingRatePerMinute: averageRates.incoming.perMinute,
        spendingRatePerSecond: averageRates.spending.perSecond,
        spendingRatePerMinute: averageRates.spending.perMinute,
        netRatePerSecond: averageRates.net.perSecond,
        netRatePerMinute: averageRates.net.perMinute
      });
    });

    itemRateBackend.previousItems = current;
    itemRateBackend.previousCoreItemCounts = currentCoreItemCounts;
    itemRateBackend.itemStats = itemStats;
  },

  getCoreItemCount: function(item) {
    return Vars.state.stats.coreItemCount.get(item, 0);
  },

  getItemRatesPerSecond: function(amount, previousAmount, incomingAmount, elapsedSeconds) {
    const netRate = (amount - previousAmount) / elapsedSeconds;
    const incomingRate = incomingAmount / elapsedSeconds;
    const spendingRate = Math.max(0, incomingRate - netRate);

    return {
      incoming: incomingRate,
      spending: spendingRate,
      net: netRate
    };
  },

  addRateSample: function(itemName, ratesPerSecond) {
    const itemRateBackend = this;
    let samplesByWindow = itemRateBackend.rateSamples[itemName];

    if (samplesByWindow === undefined) {
      samplesByWindow = itemRateBackend.createRateSampleWindows();
      itemRateBackend.rateSamples[itemName] = samplesByWindow;
    }

    return {
      incoming: itemRateBackend.addRateToWindows(
        samplesByWindow.incoming,
        ratesPerSecond.incoming
      ),
      spending: itemRateBackend.addRateToWindows(
        samplesByWindow.spending,
        ratesPerSecond.spending
      ),
      net: itemRateBackend.addRateToWindows(
        samplesByWindow.net,
        ratesPerSecond.net
      )
    };
  },

  createRateSampleWindows: function() {
    return {
      incoming: {
        second: [],
        minute: []
      },
      spending: {
        second: [],
        minute: []
      },
      net: {
        second: [],
        minute: []
      }
    };
  },

  addRateToWindows: function(samplesByWindow, ratePerSecond) {
    const itemRateBackend = this;

    return {
      perSecond: itemRateBackend.addSampleToWindow(
        samplesByWindow.second,
        ratePerSecond,
        itemRateBackend.getMaxSamples(itemRateBackend.secondAverageSeconds)
      ),
      perMinute: itemRateBackend.addSampleToWindow(
        samplesByWindow.minute,
        ratePerSecond * 60,
        itemRateBackend.getMaxSamples(itemRateBackend.minuteAverageSeconds)
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

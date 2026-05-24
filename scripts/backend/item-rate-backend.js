/** @type {ItemRateBackend} */
module.exports = {
  ticksPerSample: 2,
  timer: 0,
  currentCore: null, //needed to handle reset moving between sectors
  previousItems: {},
  rateSamples: {},
  maxRateSamples: 15,
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
    const itemStats = [];

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);

      if (amount === 0) {
        return;
      }

      itemRateBackend.knownItems[item.name] = true;
      current[item.name] = amount;
      itemRateBackend.rateSamples[item.name] = [0];
      itemStats.push({
        item: item,
        amount: amount,
        rate: 0
      });
    });

    itemRateBackend.previousItems = current;
    itemRateBackend.itemStats = itemStats;
  },

  sample: function(core, elapsedSeconds) {
    const itemRateBackend = this;

    const current = {};
    const itemStats = [];

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);

      let previousAmount = itemRateBackend.previousItems[item.name];

      if (previousAmount === undefined) {
        previousAmount = 0;
      }

      if (amount > 0) {
        itemRateBackend.knownItems[item.name] = true;
      }

      if (amount === 0 && !itemRateBackend.knownItems[item.name]) {
        return;
      }

      const rate = (amount - previousAmount) / elapsedSeconds;
      const averageRate = itemRateBackend.addRateSample(item.name, rate);

      current[item.name] = amount;

      itemStats.push({
        item: item,
        amount: amount,
        rate: averageRate
      });
    });

    itemRateBackend.previousItems = current;
    itemRateBackend.itemStats = itemStats;
  },

  addRateSample: function(itemName, rate) {
    const itemRateBackend = this;
    let samples = itemRateBackend.rateSamples[itemName];

    if (samples === undefined) {
      samples = [];
      itemRateBackend.rateSamples[itemName] = samples;
    }

    samples.push(rate);

    if (samples.length > itemRateBackend.maxRateSamples) {
      samples.shift();
    }

    let total = 0;

    for (let i = 0; i < samples.length; i++) {
      total += samples[i];
    }

    return total / samples.length;
  }
};

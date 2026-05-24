/** @type {ItemRateBackend} */
module.exports = {
  tickerPerSample: 60,
  timer: 0,
  previousItems: {},
  rates: [],
  hasPrevious: false,

  start: function() {
    const itemRateBackend = this;

    Events.run(Trigger.update, function() {
      if (!Vars.state.isGame()) {
        itemRateBackend.reset();
        return;
      }

      itemRateBackend.timer += Time.delta;

      if (itemRateBackend.timer < itemRateBackend.tickerPerSample) {
        return;
      }

      const elapsedSeconds = itemRateBackend.timer / 60;
      itemRateBackend.timer = 0;
      itemRateBackend.sample(elapsedSeconds);
    });
  },

  reset: function() {
    const itemRateBackend = this;
    itemRateBackend.timer = 0;
    itemRateBackend.previousItems = {};
    itemRateBackend.rates = [];
    itemRateBackend.hasPrevious = false;
  },

  sample: function(elapsedSeconds) {
    const itemRateBackend = this;

    if (Vars.player == null || Vars.player.team() == null) {
      itemRateBackend.reset();
      return;
    }

    const core = Vars.player.team().core();

    if (core == null) {
      itemRateBackend.reset();
      return;
    }

    const current = {};
    const rates = [];

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);

      let previousAmount = itemRateBackend.previousItems[item.name];

      if (previousAmount === undefined) {
        previousAmount = 0;
      }

      const rate = (amount - previousAmount) / elapsedSeconds;

      current[item.name] = amount;

      if (itemRateBackend.hasPrevious) {
        rates.push({
          item: item,
          amount: amount,
          rate: rate
        });
      }
    });

    itemRateBackend.previousItems = current;
    itemRateBackend.rates = rates;

    if (!itemRateBackend.hasPrevious) {
      itemRateBackend.hasPrevious = true;
    }
  }
};

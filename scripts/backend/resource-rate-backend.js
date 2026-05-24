/** @type {ResourceRateBackend} */
module.exports = {
  tickerPerSample: 60,
  timer: 0,
  previous: {},
  hasPrevious: false,

  start: function() {
    const resource_rate_backend = this;

    Events.run(Trigger.update, function() {
      if (!Vars.state.isGame()) {
        resource_rate_backend.reset();
        return;
      }

      resource_rate_backend.timer += Time.delta;

      if (resource_rate_backend.timer < resource_rate_backend.tickerPerSample) {
        return;
      }

      const elapsedSeconds = resource_rate_backend.timer / 60;
      resource_rate_backend.timer = 0;
      resource_rate_backend.sample(elapsedSeconds);
    });
  },

  reset: function() {
    this.timer = 0;
    this.previous = {};
    this.hasPrevious = false;
  },

  sample: function(elapsedSeconds) {
    const resource_rate_backend = this;

    if (Vars.player == null || Vars.player.team() == null) {
      this.reset();
      return;
    }

    Vars.player.

    const core = Vars.player.team().core();

    if (core == null) {
      this.reset();
      return;
    }

    const current = {};
    const rates = [];

    Vars.content.items().each(function(item) {
      const amount = core.items.get(item);
      const previousAmount = resource_rate_backend.previous[item.name] || 0;
      const rate = (amount - previousAmount) / elapsedSeconds;

      current[item.name] = amount;

      if (resource_rate_backend.hasPrevious && rate !== 0) {
        rates.push(item.name + ": " + resource_rate_backend.formatRate(rate) + "/s");
      }
    });

    this.previous = current;

    if (!this.hasPrevious) {
      this.hasPrevious = true;
      Log.info("[UIX] Resource rate tracker started.");
      return;
    }

    Log.info("[UIX] Core rates: " + (rates.length === 0 ? "no changes" : rates.join(", ")));
  },

  formatRate: function(rate) {
    const rounded = Math.round(rate * 10) / 10;
    return (rounded > 0 ? "+" : "") + rounded;
  }
};

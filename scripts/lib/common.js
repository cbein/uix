module.exports = {
  //takes an array of numbers and returns their average
  average: function(values) {
    if (values.length === 0) {
      return 0;
    }

    let total = 0;

    for (let i = 0; i < values.length; i++) {
      total += values[i];
    }

    return total / values.length;
  },

  scaledColor: function(value, low, high, zeroColor) {
    if (value >= high) {
      return Color.cyan;
    }

    if (value >= low) {
      return Color.green;
    }

    if (value > 0) {
      return Color.white;
    }

    if (value < 0) {
      return this.lerpRange(-value, low, high, Color.white, Color.yellow, Color.red, 1);
    }

    return zeroColor;
  },

  lerpRange: function(value, low, high, startColor, midColor, endColor, exponent) {
    if (value <= low) {
      return startColor.cpy().lerp(midColor, Math.pow(value / low, exponent));
    }

    return midColor.cpy().lerp(endColor, Math.min((value - low) / (high - low), 1));
  },

  formatNumber: function(value, useSmallDecimal) {
    let rounded = Math.round(value);

    if (useSmallDecimal && value > -1 && value < 1 && value !== 0) {
      rounded = Math.round(value * 10) / 10;
    }

    const sign = rounded < 0 ? "-" : "";
    const amount = Math.abs(rounded);

    if (amount >= 1000000) {
      return sign + this.formatAbbreviated(amount / 1000000) + "mil";
    }

    if (amount >= 1000) {
      return sign + this.formatAbbreviated(amount / 1000) + "k";
    }

    return "" + rounded;
  },

  formatAbbreviated: function(value) {
    const rounded = Math.round(value * 10) / 10;

    if (rounded === Math.round(rounded)) {
      return "" + Math.round(rounded);
    }

    return "" + rounded;
  }
};

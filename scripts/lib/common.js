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
    if (value > 0) {
      return this.lerpRange(value, low, high, Color.white, Color.green, Color.cyan, 2);
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
  }
};

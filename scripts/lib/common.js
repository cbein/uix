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
  }
};

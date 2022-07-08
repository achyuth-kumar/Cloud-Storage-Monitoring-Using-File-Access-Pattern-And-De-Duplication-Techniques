const regression = require('regression')

function linearRegression(data) {
    const result = regression.linear(data);
    return result;
}
module.exports = linearRegression;



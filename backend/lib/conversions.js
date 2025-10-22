// Currency conversion utilities

const { EXCHANGE_RATES, FEES } = require("./constants");

function convertNGNtoUSD(ngnAmount) {
  return ngnAmount * EXCHANGE_RATES.NGN_TO_USD;
}

function convertUSDtoNGN(usdAmount) {
  return usdAmount * EXCHANGE_RATES.USD_TO_NGN;
}

function calculateOnRampFee(usdAmount) {
  const fee = usdAmount * FEES.ON_RAMP_PERCENTAGE;
  return Math.max(fee, FEES.MIN_FEE_USD);
}

function calculateOffRampFee(usdAmount) {
  const fee = usdAmount * FEES.OFF_RAMP_PERCENTAGE;
  return Math.max(fee, FEES.MIN_FEE_USD);
}

function calculateOnRampTotal(fiatAmount, fiatCurrency) {
  const usdAmount = fiatCurrency === "NGN" ? convertNGNtoUSD(fiatAmount) : fiatAmount;
  const fee = calculateOnRampFee(usdAmount);
  const finalAmount = usdAmount - fee;

  return {
    fiatAmount,
    usdAmount,
    fee,
    finalAmount,
  };
}

function calculateOffRampTotal(usdAmount, targetCurrency) {
  const fee = calculateOffRampFee(usdAmount);
  const finalUsdAmount = usdAmount - fee;
  const fiatAmount = targetCurrency === "NGN" ? convertUSDtoNGN(finalUsdAmount) : finalUsdAmount;

  return {
    usdAmount,
    fee,
    finalUsdAmount,
    fiatAmount,
  };
}

function formatCurrency(amount, currency) {
  if (currency === "NGN") {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = {
  convertNGNtoUSD,
  convertUSDtoNGN,
  calculateOnRampFee,
  calculateOffRampFee,
  calculateOnRampTotal,
  calculateOffRampTotal,
  formatCurrency,
};

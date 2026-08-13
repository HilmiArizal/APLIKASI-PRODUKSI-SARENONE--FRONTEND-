/**
 * Utility functions for numeric formatting and floating point precision
 */

/**
 * Clean floating point precision inaccuracies (e.g. 7.199999999999999 -> 7.2)
 * @param {number|string} val
 * @param {number} decimals
 * @returns {number}
 */
export const cleanFloat = (val, decimals = 6) => {
  const num = parseFloat(val);
  if (isNaN(num)) return 0;
  return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
};

/**
 * Format currency to Indonesian Rupiah (e.g. 15000 -> "Rp 15.000")
 * @param {number|string} amount
 * @returns {string}
 */
export const formatRupiah = (amount) => {
  const num = parseFloat(amount) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

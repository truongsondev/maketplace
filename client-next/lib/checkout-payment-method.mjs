/**
 * @param {{
 *   data?: { codEnabled?: boolean };
 *   isSuccess: boolean;
 *   isError: boolean;
 *   isFetching: boolean;
 * }} query
 */
export function isCodPaymentCapabilityEnabled(query) {
  return (
    query.isSuccess === true &&
    query.isError !== true &&
    query.isFetching !== true &&
    query.data?.codEnabled === true
  );
}

/**
 * @param {'PAYOS' | 'COD'} selectedMethod
 * @param {boolean} codEnabled
 * @returns {'PAYOS' | 'COD'}
 */
export function getEffectiveCheckoutPaymentMethod(selectedMethod, codEnabled) {
  return selectedMethod === 'COD' && codEnabled ? 'COD' : 'PAYOS';
}

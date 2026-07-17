/** @param {import('../types/order.types').MyOrderListItem} order */
export function getUserOrderCancellationActions(order) {
  if (!order.userOrderCancellationEnabled) {
    return { canCancel: false, canRequestPaidCancel: false };
  }

  const paymentSuccessful =
    ['PAID', 'SUCCESS'].includes(order.payment.status ?? '') ||
    ['PAID', 'SUCCESS'].includes(order.payment.transactionStatus ?? '');
  const paidFlow =
    ['PAID', 'CONFIRMED'].includes(order.status) && paymentSuccessful;

  return {
    canCancel: ['PENDING', 'CONFIRMED'].includes(order.status) && !paidFlow,
    canRequestPaidCancel:
      paidFlow &&
      order.cancelRequest?.status !== 'REQUESTED' &&
      order.cancelRequest?.status !== 'APPROVED',
  };
}

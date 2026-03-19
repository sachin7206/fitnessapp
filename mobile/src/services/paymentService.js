import apiClient from './apiClient';

const paymentService = {
  // Initiate a payment (returns Razorpay order_id or QR code)
  initiatePayment: async ({ subscriptionId, amount, currency, paymentMethod, upiId }) => {
    const response = await apiClient.post('/payments/initiate', {
      subscriptionId,
      amount,
      currency: currency || 'INR',
      paymentMethod: paymentMethod || 'RAZORPAY',
      upiId,
    });
    return response.data;
  },

  // Confirm a payment (manual UPI with UTR)
  confirmPayment: async (paymentId, transactionRef) => {
    const response = await apiClient.post(
      `/payments/${paymentId}/confirm${transactionRef ? `?transactionRef=${transactionRef}` : ''}`
    );
    return response.data;
  },

  // Verify Razorpay payment after checkout
  verifyRazorpayPayment: async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    const response = await apiClient.post('/payments/razorpay/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });
    return response.data;
  },

  // Poll payment status
  getPaymentStatus: async (paymentId) => {
    const response = await apiClient.get(`/payments/${paymentId}/status`);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async () => {
    const response = await apiClient.get('/payments/history');
    return response.data;
  },
};

export default paymentService;

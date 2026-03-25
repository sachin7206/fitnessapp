import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import paymentService from '../services/paymentService';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

const PaymentScreen = ({ navigation, route }) => {
  const { subscription, plan } = route.params;
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [showUtrInput, setShowUtrInput] = useState(false);

  const handleInitiatePayment = async () => {
    setLoading(true);
    try {
      const response = await paymentService.initiatePayment({
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency || 'INR',
        paymentMethod,
        upiId: paymentMethod === 'UPI' ? upiId : null,
      });

      // Razorpay: navigate to checkout WebView
      if (paymentMethod === 'RAZORPAY' && response.data?.razorpayOrderId) {
        navigation.navigate('RazorpayCheckout', {
          razorpayOrderId: response.data.razorpayOrderId,
          razorpayKeyId: response.data.razorpayKeyId,
          payment: response.data.payment,
          plan,
          subscription,
        });
        return;
      }

      // QR / UPI: show payment details
      setPaymentData(response.data);

      if (paymentMethod === 'UPI' && response.data?.upiDeepLink) {
        try {
          const supported = await Linking.canOpenURL(response.data.upiDeepLink);
          if (supported) await Linking.openURL(response.data.upiDeepLink);
        } catch (e) { /* UPI app not available */ }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData?.payment?.id) return;

    if (!showUtrInput) {
      setShowUtrInput(true);
      return;
    }

    const trimmedUtr = utrNumber.trim();
    if (!trimmedUtr || trimmedUtr.length < 6) {
      Alert.alert('Transaction ID Required', 'Please enter your UPI Transaction ID / UTR number (at least 6 characters).');
      return;
    }

    setConfirming(true);
    try {
      const response = await paymentService.confirmPayment(paymentData.payment.id, trimmedUtr);
      if (response.data?.status === 'SUCCESS') {
        navigation.replace('PaymentSuccess', { payment: response.data, plan, subscription });
      } else {
        Alert.alert('Payment Pending', 'Payment has not been confirmed yet. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  // Payment initiation view
  if (!paymentData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'← Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{plan?.name}</Text>
              <Text style={styles.summaryValue}>{'₹' + plan?.price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>
                {plan?.durationMonths + ' month' + (plan?.durationMonths > 1 ? 's' : '')}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{'₹' + plan?.price}</Text>
            </View>
          </View>

          {/* Payment Method Selection */}
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          {/* Razorpay — Recommended */}
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'RAZORPAY' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('RAZORPAY')}
          >
            <Text style={styles.methodIcon}>💳</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>UPI / Cards / Net Banking</Text>
              <Text style={styles.methodDesc}>Pay securely via UPI, Debit/Credit Card, Net Banking, Wallets</Text>
              <View style={styles.recommendedTag}>
                <Text style={styles.recommendedTagText}>RECOMMENDED</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'RAZORPAY' && styles.radioSelected]}>
              {paymentMethod === 'RAZORPAY' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Manual QR Code */}
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'QR_CODE' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('QR_CODE')}
          >
            <Text style={styles.methodIcon}>🔲</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Scan QR Code</Text>
              <Text style={styles.methodDesc}>Pay using any UPI app by scanning QR code</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'QR_CODE' && styles.radioSelected]}>
              {paymentMethod === 'QR_CODE' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* UPI Direct */}
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'UPI' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('UPI')}
          >
            <Text style={styles.methodIcon}>📱</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>UPI Direct Pay</Text>
              <Text style={styles.methodDesc}>Pay directly using your UPI ID</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'UPI' && styles.radioSelected]}>
              {paymentMethod === 'UPI' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {paymentMethod === 'UPI' && (
            <View style={styles.upiInputContainer}>
              <Text style={styles.inputLabel}>Your UPI ID</Text>
              <TextInput
                style={styles.upiInput}
                placeholder="yourname@upi"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handleInitiatePayment}
            disabled={loading || (paymentMethod === 'UPI' && !upiId)}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payButtonText}>{'Pay ₹' + plan?.price}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Manual QR / UPI flow (only reached for non-Razorpay methods)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.paymentContent}>
        <View style={styles.amountBanner}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>{'₹' + paymentData.payment?.amount}</Text>
        </View>

        {paymentData.qrCodeBase64 && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan with any UPI app</Text>
            <View style={styles.qrImageWrapper}>
              <Image
                source={{ uri: 'data:image/png;base64,' + paymentData.qrCodeBase64 }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrHint}>
              Open Google Pay, PhonePe, Paytm or any UPI app and scan this QR code
            </Text>
          </View>
        )}

        {paymentData.upiDeepLink && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.upiAppButton}
            onPress={async () => {
              try { await Linking.openURL(paymentData.upiDeepLink); } catch {
                Alert.alert('Error', 'Could not open UPI app.');
              }
            }}
          >
            <Text style={styles.upiAppButtonText}>Open UPI App to Pay</Text>
          </TouchableOpacity>
        )}

        <View style={styles.merchantInfo}>
          <Text style={styles.merchantLabel}>{'Pay to: ' + paymentData.merchantName}</Text>
          <Text style={styles.merchantLabel}>{'UPI ID: ' + paymentData.merchantUpiId}</Text>
          <Text style={styles.merchantLabel}>{'Ref: ' + paymentData.payment?.transactionRef}</Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>How to pay:</Text>
          <Text style={styles.stepText}>1. Scan the QR code above with any UPI app</Text>
          <Text style={styles.stepText}>{'2. Complete the payment of ₹' + paymentData.payment?.amount}</Text>
          <Text style={styles.stepText}>3. Note down your UPI Transaction ID / UTR number</Text>
          <Text style={styles.stepText}>4. Enter it below and tap confirm</Text>
        </View>

        {showUtrInput && (
          <View style={styles.utrSection}>
            <Text style={styles.utrLabel}>Enter UPI Transaction ID / UTR Number</Text>
            <Text style={styles.utrHint}>
              {'You can find this in your UPI app → Payment History → Transaction Details'}
            </Text>
            <TextInput
              style={styles.utrInput}
              placeholder="e.g. 412345678901 or TXN12345ABC"
              value={utrNumber}
              onChangeText={setUtrNumber}
              autoCapitalize="characters"
              returnKeyType="done"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmButton, showUtrInput && !utrNumber.trim() && styles.confirmButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {showUtrInput ? 'Confirm Payment' : "I've Completed the Payment"}
            </Text>
          )}
        </TouchableOpacity>

        {!showUtrInput && (
          <Text style={styles.autoCheckNote}>
            After payment, tap the button above to enter your transaction ID
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  backButton: { padding: spacing.sm },
  backButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, paddingHorizontal: spacing.md },
  paymentContent: { alignItems: 'center' },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.lg, marginBottom: spacing.lg, ...shadows.sm,
  },
  summaryTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { ...typography.body, color: colors.text.secondary },
  summaryValue: { ...typography.body, color: colors.text.primary, fontWeight: '500' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
  totalLabel: { fontSize: 17, fontWeight: 'bold', color: colors.text.primary },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 2, borderColor: colors.border,
  },
  methodCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
  methodIcon: { fontSize: 28, marginRight: spacing.md },
  methodInfo: { flex: 1 },
  methodName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  methodDesc: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  recommendedTag: {
    backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start', marginTop: 6,
  },
  recommendedTagText: { color: colors.text.inverse, fontSize: 10, fontWeight: 'bold' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  upiInputContainer: { marginTop: spacing.md },
  inputLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginBottom: 6 },
  upiInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: colors.border, ...shadows.md,
  },
  payButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center' },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: colors.text.inverse, fontSize: 18, fontWeight: 'bold' },
  amountBanner: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl, alignItems: 'center', marginTop: spacing.lg, width: '100%',
  },
  amountLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  amountValue: { color: colors.text.inverse, fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  qrContainer: { alignItems: 'center', marginTop: spacing.lg, width: '100%' },
  qrTitle: { ...typography.body, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.md },
  qrImageWrapper: {
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.md,
  },
  qrImage: { width: 250, height: 250 },
  qrHint: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md, lineHeight: 20, paddingHorizontal: spacing.lg },
  upiAppButton: {
    backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg, marginTop: spacing.lg, width: '100%', alignItems: 'center',
  },
  upiAppButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: 'bold' },
  merchantInfo: {
    marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: colors.background, borderRadius: borderRadius.lg, width: '100%',
  },
  merchantLabel: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: 4 },
  confirmButton: {
    backgroundColor: colors.success, paddingVertical: 16, borderRadius: borderRadius.lg,
    marginTop: spacing.lg, width: '100%', alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { color: colors.text.inverse, fontSize: 17, fontWeight: 'bold' },
  autoCheckNote: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
  stepsContainer: {
    marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: colors.warning + '15', borderRadius: borderRadius.lg, width: '100%', borderWidth: 1, borderColor: colors.warning + '30',
  },
  stepsTitle: { ...typography.body, fontWeight: 'bold', color: colors.text.primary, marginBottom: spacing.sm },
  stepText: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 22 },
  utrSection: {
    marginTop: spacing.lg, width: '100%', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.primary,
  },
  utrLabel: { ...typography.body, fontWeight: 'bold', color: colors.text.primary, marginBottom: 4 },
  utrHint: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.md, lineHeight: 18 },
  utrInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    fontWeight: '600', letterSpacing: 1, color: colors.text.primary,
  },
});

export default PaymentScreen;


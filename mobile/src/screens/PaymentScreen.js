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
import { useTranslation } from '../i18n';

const PaymentScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { subscription, plan } = route.params;
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [showUtrInput, setShowUtrInput] = useState(false);

  // Load Razorpay checkout.js script for web platform
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject('Not a browser');
      if (window.Razorpay) return resolve(window.Razorpay);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject('Failed to load Razorpay SDK');
      document.body.appendChild(script);
    });
  };

  // Open Razorpay checkout directly in the browser (web platform)
  const openRazorpayWeb = async (razorpayOrderId, razorpayKeyId, payment) => {
    try {
      const Razorpay = await loadRazorpayScript();
      const options = {
        key: razorpayKeyId,
        amount: (plan?.price || 0) * 100,
        currency: 'INR',
        name: 'FitnessApp',
        description: `${plan?.name || 'Subscription'} - ${plan?.durationMonths || 0} months`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Payment successful — verify with backend
          setLoading(true);
          try {
            const verifyRes = await paymentService.verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            if (verifyRes.data?.status === 'SUCCESS') {
              navigation.replace('PaymentSuccess', { payment: verifyRes.data, plan, subscription });
            } else {
              Alert.alert('Payment Issue', 'Payment verification pending. Please contact support.');
            }
          } catch (err) {
            Alert.alert('Verification Failed', err.response?.data?.message || 'Failed to verify payment. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the popup without paying
          },
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#111827' },
        notes: { subscriptionId: subscription?.id || '' },
      };
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        Alert.alert('Payment Failed', response.error?.description || 'Payment was not completed.');
      });
      rzp.open();
    } catch (err) {
      Alert.alert('Error', typeof err === 'string' ? err : 'Failed to open payment gateway.');
    }
  };

  const handleInitiatePayment = async () => {
    // DEMO mode — skip real gateway, confirm payment directly
    if (paymentMethod === 'DEMO') {
      setLoading(true);
      try {
        // Create a payment record on backend
        const response = await paymentService.initiatePayment({
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency || 'INR',
          paymentMethod: 'QR_CODE', // use manual method so backend creates a record
          upiId: null,
        });
        const paymentId = response.data?.payment?.id;
        if (!paymentId) {
          Alert.alert('Error', 'Failed to create payment record.');
          return;
        }
        // Immediately confirm it with a demo transaction ref
        const demoRef = 'DEMO-' + Date.now();
        const confirmRes = await paymentService.confirmPayment(paymentId, demoRef);
        if (confirmRes.data?.status === 'SUCCESS') {
          navigation.replace('PaymentSuccess', { payment: confirmRes.data, plan, subscription });
        } else {
          Alert.alert('Error', 'Demo payment confirmation failed.');
        }
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Demo payment failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.initiatePayment({
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency || 'INR',
        paymentMethod,
        upiId: paymentMethod === 'UPI' ? upiId : null,
      });

      // Razorpay payment
      if (paymentMethod === 'RAZORPAY' && response.data?.razorpayOrderId) {
        if (Platform.OS === 'web') {
          // Web: open Razorpay checkout popup directly in browser
          await openRazorpayWeb(
            response.data.razorpayOrderId,
            response.data.razorpayKeyId,
            response.data.payment,
          );
        } else {
          // Mobile: navigate to WebView-based checkout
          navigation.navigate('RazorpayCheckout', {
            razorpayOrderId: response.data.razorpayOrderId,
            razorpayKeyId: response.data.razorpayKeyId,
            payment: response.data.payment,
            plan,
            subscription,
          });
        }
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
      Alert.alert(t('payment.transactionIdRequired'), t('payment.transactionIdMsg'));
      return;
    }

    setConfirming(true);
    try {
      const response = await paymentService.confirmPayment(paymentData.payment.id, trimmedUtr);
      if (response.data?.status === 'SUCCESS') {
        navigation.replace('PaymentSuccess', { payment: response.data, plan, subscription });
      } else {
        Alert.alert(t('payment.paymentPending'), t('payment.paymentPendingMsg'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || 'Failed to confirm payment');
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
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('payment.title')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t('payment.orderSummary')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{plan?.name}</Text>
              <Text style={styles.summaryValue}>{'₹' + plan?.price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('payment.duration')}</Text>
              <Text style={styles.summaryValue}>
                {plan?.durationMonths + ' month' + (plan?.durationMonths > 1 ? 's' : '')}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>{t('payment.total')}</Text>
              <Text style={styles.totalValue}>{'₹' + plan?.price}</Text>
            </View>
          </View>

          {/* Payment Method Selection */}
          <Text style={styles.sectionTitle}>{t('payment.selectPaymentMethod')}</Text>

          {/* Razorpay — Recommended */}
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'RAZORPAY' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('RAZORPAY')}
          >
            <Text style={styles.methodIcon}>💳</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{t('payment.upiCardsNetBanking')}</Text>
              <Text style={styles.methodDesc}>{t('payment.upiCardsDesc')}</Text>
              <View style={styles.recommendedTag}>
                <Text style={styles.recommendedTagText}>{t('payment.recommended')}</Text>
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
              <Text style={styles.methodName}>{t('payment.scanQrCode')}</Text>
              <Text style={styles.methodDesc}>{t('payment.scanQrDesc')}</Text>
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
              <Text style={styles.methodName}>{t('payment.upiDirectPay')}</Text>
              <Text style={styles.methodDesc}>{t('payment.upiDirectDesc')}</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'UPI' && styles.radioSelected]}>
              {paymentMethod === 'UPI' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Demo Payment — for testing the subscription flow */}
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'DEMO' && styles.methodCardSelected, paymentMethod === 'DEMO' && { borderColor: colors.warning }]}
            onPress={() => setPaymentMethod('DEMO')}
          >
            <Text style={styles.methodIcon}>🧪</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{t('payment.testPayment')}</Text>
              <Text style={styles.methodDesc}>{t('payment.testPaymentDesc')}</Text>
              <View style={[styles.recommendedTag, { backgroundColor: colors.warning }]}>
                <Text style={styles.recommendedTagText}>{t('payment.forTesting')}</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'DEMO' && styles.radioSelected]}>
              {paymentMethod === 'DEMO' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {paymentMethod === 'UPI' && (
            <View style={styles.upiInputContainer}>
              <Text style={styles.inputLabel}>{t('payment.yourUpiId')}</Text>
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
              <Text style={styles.payButtonText}>
                {paymentMethod === 'DEMO' ? t('payment.activateTest') : `${t('payment.completePayment')} ₹${plan?.price}`}
              </Text>
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
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('payment.completePayment')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.paymentContent}>
          <View style={styles.amountBanner}>
            <Text style={styles.amountLabel}>{t('payment.amountToPay')}</Text>
          <Text style={styles.amountValue}>{'₹' + paymentData.payment?.amount}</Text>
        </View>

        {paymentData.qrCodeBase64 && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>{t('payment.scanWithUpi')}</Text>
            <View style={styles.qrImageWrapper}>
              <Image
                source={{ uri: 'data:image/png;base64,' + paymentData.qrCodeBase64 }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrHint}>
              {t('payment.scanQrHint')}
            </Text>
          </View>
        )}

        {paymentData.upiDeepLink && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.upiAppButton}
            onPress={async () => {
              try { await Linking.openURL(paymentData.upiDeepLink); } catch {
                Alert.alert(t('common.error'), 'Could not open UPI app.');
              }
            }}
          >
            <Text style={styles.upiAppButtonText}>{t('payment.openUpiApp')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.merchantInfo}>
          <Text style={styles.merchantLabel}>{`${t('payment.payTo')}: ${paymentData.merchantName}`}</Text>
          <Text style={styles.merchantLabel}>{`${t('payment.upiId')}: ${paymentData.merchantUpiId}`}</Text>
          <Text style={styles.merchantLabel}>{`${t('payment.ref')}: ${paymentData.payment?.transactionRef}`}</Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>{t('payment.howToPay')}</Text>
          <Text style={styles.stepText}>{t('payment.step1')}</Text>
          <Text style={styles.stepText}>{'2. Complete the payment of ₹' + paymentData.payment?.amount}</Text>
          <Text style={styles.stepText}>{t('payment.step3')}</Text>
          <Text style={styles.stepText}>{t('payment.step4')}</Text>
        </View>

        {showUtrInput && (
          <View style={styles.utrSection}>
            <Text style={styles.utrLabel}>{t('payment.enterUtrLabel')}</Text>
            <Text style={styles.utrHint}>
              {t('payment.utrHint')}
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
              {showUtrInput ? t('payment.confirmPayment') : t('payment.completedPayment')}
            </Text>
          )}
        </TouchableOpacity>

        {!showUtrInput && (
          <Text style={styles.autoCheckNote}>
            {t('payment.afterPaymentNote')}
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


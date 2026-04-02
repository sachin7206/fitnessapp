import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import paymentService from '../services/paymentService';
import { colors } from '../config/theme';
import { useTranslation } from '../i18n';

const RazorpayCheckoutScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { razorpayOrderId, razorpayKeyId, payment, plan, subscription } = route.params;
  const [verifying, setVerifying] = useState(false);

  const checkoutHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; margin: 0; background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .loading { text-align: center; color: #666; }
        .loading h2 { color: #333; }
      </style>
    </head>
    <body>
      <div class="loading">
        <h2>Opening Payment...</h2>
        <p>Please wait while we redirect you to the payment gateway.</p>
      </div>
      <script>
        var options = {
          key: "${razorpayKeyId}",
          amount: ${(plan?.price || 0) * 100},
          currency: "INR",
          name: "FitnessApp",
          description: "${plan?.name || 'Subscription'} - ${plan?.durationMonths || 0} months",
          order_id: "${razorpayOrderId}",
          handler: function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "SUCCESS",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }));
          },
          modal: {
            ondismiss: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DISMISSED" }));
            },
            escape: false,
            backdropclose: false
          },
          prefill: {
            name: "",
            email: "",
            contact: ""
          },
          theme: { color: "#111827" },
          notes: { subscriptionId: "${subscription?.id || ''}" }
        };

        try {
          var rzp = new Razorpay(options);
          rzp.on("payment.failed", function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "FAILED",
              error: response.error ? response.error.description : "Payment failed"
            }));
          });
          rzp.open();
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "ERROR",
            error: e.message || "Failed to initialize Razorpay"
          }));
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'SUCCESS') {
        setVerifying(true);
        try {
          const response = await paymentService.verifyRazorpayPayment(
            data.razorpay_order_id,
            data.razorpay_payment_id,
            data.razorpay_signature
          );
          if (response.data?.status === 'SUCCESS') {
            navigation.replace('PaymentSuccess', {
              payment: response.data,
              plan,
              subscription,
            });
          } else {
            Alert.alert(t('payment.paymentIssue'), t('payment.verificationPending'), [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
        } catch (error) {
          Alert.alert(t('payment.verificationFailed'), error.response?.data?.message || t('payment.verificationPending'), [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } finally {
          setVerifying(false);
        }
      } else if (data.type === 'FAILED') {
        Alert.alert(t('payment.paymentFailed'), data.error || t('payment.paymentNotCompleted'), [
          { text: t('common.retry'), onPress: () => navigation.goBack() },
        ]);
      } else if (data.type === 'DISMISSED') {
        navigation.goBack();
      } else if (data.type === 'ERROR') {
        Alert.alert(t('common.error'), data.error || t('common.error'), [
          { text: t('common.back'), onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  if (verifying) {
    return (
      <View style={styles.verifyingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.verifyingText}>{t('payment.verifyingPayment')}</Text>
        <Text style={styles.verifyingSubtext}>{t('payment.doNotClose')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: checkoutHtml }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('payment.loadingGateway')}</Text>
          </View>
        )}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webview: { flex: 1 },
  loadingContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.text.secondary },
  verifyingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
  },
  verifyingText: { marginTop: 16, fontSize: 18, fontWeight: 'bold', color: colors.text.primary },
  verifyingSubtext: { marginTop: 8, fontSize: 14, color: colors.text.secondary },
});

export default RazorpayCheckoutScreen;


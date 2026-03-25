import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import paymentService from '../services/paymentService';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

const PaymentHistoryScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await paymentService.getPaymentHistory();
      setPayments(response.data || []);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return colors.success;
      case 'PENDING': return colors.warning;
      case 'FAILED': return colors.error;
      case 'REFUNDED': return colors.secondary;
      default: return colors.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      case 'REFUNDED': return '↩️';
      default: return '•';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderPayment = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentLeft}>
          <Text style={styles.paymentDescription}>{item.description || 'Subscription Payment'}</Text>
          <Text style={styles.paymentDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>₹{item.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusIcon(item.status)} {item.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <Text style={styles.detailText}>Method: {item.paymentMethod}</Text>
        <Text style={styles.detailText}>Ref: {item.transactionRef}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No payment history yet</Text>
          <Text style={styles.emptySubtext}>Your payments will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.h3, color: colors.text.primary },
  emptySubtext: { ...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.xs },
  listContent: { padding: spacing.md },
  paymentCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.sm,
  },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentLeft: { flex: 1 },
  paymentRight: { alignItems: 'flex-end' },
  paymentDescription: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  paymentDate: { ...typography.caption, color: colors.text.secondary, marginTop: 4 },
  paymentAmount: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  paymentDetails: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  detailText: { ...typography.caption, color: colors.text.secondary },
});

export default PaymentHistoryScreen;


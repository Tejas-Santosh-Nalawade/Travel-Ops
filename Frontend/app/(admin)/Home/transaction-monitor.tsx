/**
 * Transaction Monitor - Admin Dashboard
 * Real-time monitoring of distributed transactions with rollback capability
 */
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type Transaction = {
  transaction_id: string;
  transaction_number: string;
  customer_name: string;
  journey_destination: string;
  status: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  total_amount: number;
  started_at: string;
  failed_at: string | null;
  error_message: string | null;
  requires_attention: boolean;
};

type TransactionStats = {
  total_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  compensated_transactions: number;
  partial_failures: number;
  success_rate: number;
  dlq_count: number;
};

export default function TransactionMonitor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load transactions
      const { data: txnData, error: txnError } = await supabase.rpc('get_active_transactions', {
        p_status: selectedStatus,
        p_limit: 100,
      });

      if (txnError) throw txnError;
      setTransactions(txnData || []);

      // Load statistics
      const { data: statsData, error: statsError } = await supabase.rpc('get_transaction_statistics', {
        p_days_back: 7,
      });

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }
    } catch (error: any) {
      console.error('Error loading transaction data:', error);
      Alert.alert('Error', 'Failed to load transaction data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'compensating': return 'bg-orange-500';
      case 'compensated': return 'bg-yellow-500';
      case 'partial_failure': return 'bg-red-700';
      case 'initiated': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'hourglass';
      case 'failed': return 'close-circle';
      case 'compensating': return 'refresh-circle';
      case 'compensated': return 'arrow-undo-circle';
      case 'partial_failure': return 'warning';
      default: return 'ellipse';
    }
  };

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const manualRollback = async (txnId: string, txnNumber: string) => {
    Alert.alert(
      'Manual Rollback',
      `Are you sure you want to manually rollback transaction ${txnNumber}? This will compensate all completed steps.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('manual_rollback_transaction', {
                p_transaction_id: txnId,
                p_reason: 'Manual rollback initiated by admin',
                p_admin_id: (await supabase.auth.getUser()).data.user?.id,
              });

              if (error) throw error;

              if (data && data.length > 0 && data[0].success) {
                Alert.alert('Success', `Rollback initiated for ${data[0].compensation_count} steps`);
                loadData();
              } else {
                Alert.alert('Error', data[0]?.message || 'Rollback failed');
              }
            } catch (error: any) {
              console.error('Error initiating rollback:', error);
              Alert.alert('Error', 'Failed to initiate rollback');
            }
          },
        },
      ]
    );
  };

  const viewTransactionDetails = (transaction: Transaction) => {
    router.push({
      pathname: '/Home/transaction-details',
      params: { transactionId: transaction.transaction_id }
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-emerald-500 px-6 py-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Transaction Monitor
            </Text>
            <Text className="text-emerald-100 text-sm">
              Real-time transactional integrity
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} className="bg-white/20 rounded-full p-2">
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        {stats && (
          <View className="bg-white/10 rounded-2xl p-4 mb-2">
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-white/80 text-xs">Success Rate</Text>
                <Text className="text-white font-extrabold text-2xl">
                  {stats.success_rate?.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-white/80 text-xs">Total (7d)</Text>
                <Text className="text-white font-extrabold text-2xl">
                  {stats.total_transactions}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-white/80 text-xs">Failed</Text>
                <Text className="text-white font-extrabold text-2xl">
                  {stats.failed_transactions}
                </Text>
              </View>
            </View>
            {stats.dlq_count > 0 && (
              <View className="bg-red-500/20 rounded-lg px-3 py-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={16} color="#fff" />
                  <Text className="text-white font-bold ml-2 text-sm">
                    Dead Letter Queue
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/Home/dead-letter-queue' as any)}
                  className="bg-white/20 px-3 py-1 rounded-full"
                >
                  <Text className="text-white font-bold text-xs">{stats.dlq_count} items</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-3 bg-white border-b border-gray-200">
        <View className="flex-row gap-2">
          {[
            { value: null, label: 'All', icon: 'apps' },
            { value: 'in_progress', label: 'In Progress', icon: 'hourglass' },
            { value: 'completed', label: 'Completed', icon: 'checkmark-circle' },
            { value: 'failed', label: 'Failed', icon: 'close-circle' },
            { value: 'compensating', label: 'Compensating', icon: 'refresh-circle' },
            { value: 'compensated', label: 'Compensated', icon: 'arrow-undo-circle' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value || 'all'}
              onPress={() => setSelectedStatus(filter.value)}
              className={`flex-row items-center px-4 py-2 rounded-xl ${
                selectedStatus === filter.value ? 'bg-emerald-500' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedStatus === filter.value ? '#fff' : '#6b7280'}
              />
              <Text className={`ml-2 font-bold text-sm ${
                selectedStatus === filter.value ? 'text-white' : 'text-gray-700'
              }`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4 font-semibold">Loading transactions...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
          }
        >
          {transactions.map((txn) => (
            <TouchableOpacity
              key={txn.transaction_id}
              onPress={() => viewTransactionDetails(txn)}
              className={`bg-white rounded-3xl p-6 mb-4 shadow-lg ${
                txn.requires_attention ? 'border-2 border-red-500' : ''
              }`}
            >
              {/* Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className={`${getStatusColor(txn.status)} rounded-full p-2 mr-2`}>
                      <Ionicons name={getStatusIcon(txn.status) as any} size={16} color="#fff" />
                    </View>
                    <Text className="text-lg font-extrabold text-gray-900">
                      {txn.transaction_number}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm capitalize">
                    {txn.status.replace('_', ' ')}
                  </Text>
                </View>
                {txn.requires_attention && (
                  <View className="bg-red-100 px-3 py-1 rounded-full">
                    <Text className="text-red-700 text-xs font-extrabold">ATTENTION</Text>
                  </View>
                )}
              </View>

              {/* Customer & Journey */}
              <View className="bg-gray-50 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="person" size={16} color="#6b7280" />
                  <Text className="ml-2 text-gray-700 font-semibold">{txn.customer_name}</Text>
                </View>
                {txn.journey_destination && (
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text className="ml-2 text-gray-600">{txn.journey_destination}</Text>
                  </View>
                )}
              </View>

              {/* Progress */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-700 font-semibold text-sm">Progress</Text>
                  <Text className="text-gray-600 text-sm">
                    {txn.completed_steps}/{txn.total_steps} steps
                  </Text>
                </View>
                <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <View
                    className={`h-full ${
                      txn.failed_steps > 0 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${(txn.completed_steps / txn.total_steps) * 100}%`,
                    }}
                  />
                </View>
              </View>

              {/* Financial */}
              <View className="bg-emerald-50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-semibold">Transaction Amount</Text>
                  <Text className="text-emerald-700 font-extrabold text-lg">
                    {formatPrice(txn.total_amount)}
                  </Text>
                </View>
              </View>

              {/* Error Message */}
              {txn.error_message && (
                <View className="bg-red-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-start">
                    <Ionicons name="alert-circle" size={16} color="#dc2626" className="mt-0.5" />
                    <Text className="ml-2 text-red-700 text-sm flex-1">{txn.error_message}</Text>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <Text className="text-gray-400 text-xs">
                  Started: {formatDate(txn.started_at)}
                </Text>
                {(txn.status === 'completed' || txn.status === 'in_progress') && (
                  <TouchableOpacity
                    onPress={() => manualRollback(txn.transaction_id, txn.transaction_number)}
                    className="bg-red-500 rounded-lg px-4 py-2 flex-row items-center"
                  >
                    <Ionicons name="arrow-undo" size={16} color="#fff" />
                    <Text className="text-white font-bold ml-2 text-sm">Rollback</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {transactions.length === 0 && (
            <View className="items-center justify-center py-20">
              <Ionicons name="checkmark-done-circle" size={64} color="#d1d5db" />
              <Text className="text-gray-400 font-bold text-lg mt-4">
                No {selectedStatus ? selectedStatus.replace('_', ' ') : ''} transactions
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

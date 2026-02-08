/**
 * Dead Letter Queue - Admin Dashboard
 * Manage failed compensation actions requiring manual intervention
 */
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type DLQItem = {
  dlq_id: string;
  transaction_number: string;
  step_name: string;
  failure_reason: string;
  attempts_made: number;
  last_attempt_at: string;
  resolution_status: string;
  created_at: string;
  escalated: boolean;
};

export default function DeadLetterQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<DLQItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedItem, setSelectedItem] = useState<DLQItem | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadItems();
  }, [selectedStatus]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_dlq_items', {
        p_status: selectedStatus,
        p_limit: 100,
      });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading DLQ items:', error);
      Alert.alert('Error', 'Failed to load Dead Letter Queue items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const escalateItem = async (dlqId: string) => {
    try {
      const { error } = await supabase
        .from('rollback_dead_letter_queue')
        .update({
          escalated: true,
          escalated_at: new Date().toISOString(),
        })
        .eq('dlq_id', dlqId);

      if (error) throw error;

      Alert.alert('Success', 'Item escalated to senior operations');
      loadItems();
    } catch (error: any) {
      console.error('Error escalating item:', error);
      Alert.alert('Error', 'Failed to escalate item');
    }
  };

  const markResolved = async (dlqId: string, notes: string) => {
    if (!notes.trim()) {
      Alert.alert('Missing Information', 'Please provide resolution notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('rollback_dead_letter_queue')
        .update({
          resolution_status: 'resolved',
          resolution_notes: notes,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('dlq_id', dlqId);

      if (error) throw error;

      Alert.alert('Success', 'Item marked as resolved');
      setShowResolutionModal(false);
      setSelectedItem(null);
      setResolutionNotes('');
      loadItems();
    } catch (error: any) {
      console.error('Error resolving item:', error);
      Alert.alert('Error', 'Failed to mark item as resolved');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAgeInHours = (dateString: string) => {
    const age = Date.now() - new Date(dateString).getTime();
    return Math.floor(age / (1000 * 60 * 60));
  };

  if (showResolutionModal && selectedItem) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-red-500 px-6 py-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => {
                setShowResolutionModal(false);
                setSelectedItem(null);
                setResolutionNotes('');
              }}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-extrabold text-white mb-1">
                Resolve DLQ Item
              </Text>
              <Text className="text-red-100 text-sm">{selectedItem.dlq_id}</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Item Details */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-3">Item Details</Text>

            <View className="bg-gray-50 rounded-2xl p-4 mb-3">
              <View className="mb-3">
                <Text className="text-gray-600 text-sm mb-1">Transaction</Text>
                <Text className="text-gray-900 font-bold">{selectedItem.transaction_number}</Text>
              </View>

              <View className="mb-3">
                <Text className="text-gray-600 text-sm mb-1">Failed Step</Text>
                <Text className="text-gray-900 font-bold">{selectedItem.step_name}</Text>
              </View>

              <View className="mb-3">
                <Text className="text-gray-600 text-sm mb-1">Attempts Made</Text>
                <Text className="text-red-600 font-bold">{selectedItem.attempts_made}</Text>
              </View>

              <View>
                <Text className="text-gray-600 text-sm mb-1">Last Attempt</Text>
                <Text className="text-gray-700">{formatDate(selectedItem.last_attempt_at)}</Text>
              </View>
            </View>

            <View className="bg-red-50 rounded-2xl p-4">
              <Text className="text-red-700 font-bold mb-2">Failure Reason:</Text>
              <Text className="text-red-900">{selectedItem.failure_reason}</Text>
            </View>
          </View>

          {/* Resolution Form */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-3">Resolution Details</Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Resolution Notes * (Required)
              </Text>
              <TextInput
                placeholder="Describe how this issue was resolved manually..."
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
                multiline
                numberOfLines={6}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Text className="text-xs text-gray-500 mb-4">
              Document the manual steps taken to resolve this compensation failure. This will help prevent similar issues in the future.
            </Text>

            <TouchableOpacity
              onPress={() => markResolved(selectedItem.dlq_id, resolutionNotes)}
              className="bg-green-500 rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text className="text-white font-extrabold ml-2 text-lg">
                Mark as Resolved
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-red-500 px-6 py-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Dead Letter Queue
            </Text>
            <Text className="text-red-100 text-sm">
              Failed compensations requiring manual intervention
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} className="bg-white/20 rounded-full p-2">
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="bg-white/10 rounded-2xl p-4">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white text-3xl font-extrabold">{items.length}</Text>
              <Text className="text-white/80 text-xs">Total Items</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-3xl font-extrabold">
                {items.filter(i => i.escalated).length}
              </Text>
              <Text className="text-white/80 text-xs">Escalated</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-3xl font-extrabold">
                {items.filter(i => getAgeInHours(i.created_at) > 24).length}
              </Text>
              <Text className="text-white/80 text-xs">&gt;24h Old</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-3 bg-white border-b border-gray-200">
        <View className="flex-row gap-2">
          {[
            { value: 'pending', label: 'Pending', icon: 'hourglass' },
            { value: 'in_review', label: 'In Review', icon: 'eye' },
            { value: 'resolved', label: 'Resolved', icon: 'checkmark-circle' },
            { value: 'escalated', label: 'Escalated', icon: 'alert-circle' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => setSelectedStatus(filter.value)}
              className={`flex-row items-center px-4 py-2 rounded-xl ${
                selectedStatus === filter.value ? 'bg-red-500' : 'bg-gray-100'
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
          <ActivityIndicator size="large" color="#ef4444" />
          <Text className="text-gray-600 mt-4 font-semibold">Loading DLQ items...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ef4444']} />
          }
        >
          {items.map((item) => {
            const ageHours = getAgeInHours(item.created_at);
            const isCritical = ageHours > 24;

            return (
              <View
                key={item.dlq_id}
                className={`bg-white rounded-3xl p-6 mb-4 shadow-lg ${
                  isCritical ? 'border-2 border-red-600' : ''
                }`}
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-extrabold text-gray-900 mb-1">
                      {item.dlq_id}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {item.transaction_number}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    {item.escalated && (
                      <View className="bg-orange-500 rounded-full px-3 py-1">
                        <Text className="text-white text-xs font-extrabold">ESCALATED</Text>
                      </View>
                    )}
                    {isCritical && (
                      <View className="bg-red-600 rounded-full px-3 py-1">
                        <Text className="text-white text-xs font-extrabold">CRITICAL</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Failed Step */}
                <View className="bg-red-50 rounded-2xl p-4 mb-3">
                  <Text className="text-red-700 font-bold mb-2">Failed Step:</Text>
                  <Text className="text-gray-900 font-semibold">{item.step_name}</Text>
                </View>

                {/* Failure Details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <View className="mb-3">
                    <Text className="text-gray-600 text-sm mb-1">Failure Reason</Text>
                    <Text className="text-gray-900">{item.failure_reason}</Text>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 text-sm">Attempts Made</Text>
                    <Text className="text-red-600 font-bold">{item.attempts_made}</Text>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 text-sm">Age</Text>
                    <Text className={`font-bold ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>
                      {ageHours}h
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-600 text-sm">Last Attempt</Text>
                    <Text className="text-gray-700 text-xs">
                      {formatDate(item.last_attempt_at)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {item.resolution_status === 'pending' && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedItem(item);
                        setShowResolutionModal(true);
                      }}
                      className="flex-1 bg-green-500 rounded-xl py-3 flex-row items-center justify-center"
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text className="text-white font-bold ml-2">Resolve</Text>
                    </TouchableOpacity>

                    {!item.escalated && (
                      <TouchableOpacity
                        onPress={() => escalateItem(item.dlq_id)}
                        className="flex-1 bg-orange-500 rounded-xl py-3 flex-row items-center justify-center"
                      >
                        <Ionicons name="arrow-up-circle" size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Escalate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {item.resolution_status === 'resolved' && (
                  <View className="bg-green-50 rounded-xl p-3 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="ml-2 text-green-700 font-bold">Resolved</Text>
                  </View>
                )}
              </View>
            );
          })}

          {items.length === 0 && (
            <View className="items-center justify-center py-20">
              <Ionicons name="checkmark-done-circle" size={64} color="#d1d5db" />
              <Text className="text-gray-400 font-bold text-lg mt-4">
                No {selectedStatus} items in DLQ
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                All compensations completed successfully
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

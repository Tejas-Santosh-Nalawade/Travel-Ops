/**
 * Modification Requests Management Screen - Admin Dashboard
 * View, approve, and reject customer modification requests
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

type ModificationRequest = {
  request_id: string;
  request_number: string;
  journey_id: string;
  customer_name: string;
  customer_email: string;
  modification_type: string;
  status: string;
  priority: string;
  original_amount: number;
  refund_amount: number;
  net_amount: number;
  requested_at: string;
  hours_until_journey: number;
  is_urgent: boolean;
  journey_details: any;
};

export default function ModificationRequests() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ModificationRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ModificationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [selectedStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_pending_modification_requests', {
        p_status: selectedStatus,
        p_limit: 100,
      });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load modification requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const openRequestDetail = (request: ModificationRequest) => {
    setSelectedRequest(request);
    setReviewNotes('');
    setShowDetailModal(true);
  };

  const updateRequestStatus = async (newStatus: string) => {
    if (!selectedRequest) return;

    if (newStatus === 'rejected' && !reviewNotes.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for rejection');
      return;
    }

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${newStatus} this ${selectedRequest.modification_type} request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setProcessing(true);
              const { data, error } = await supabase.rpc('update_modification_request_status', {
                p_request_id: selectedRequest.request_id,
                p_new_status: newStatus,
                p_review_notes: reviewNotes || null,
                p_approved_changes: null,
                p_reviewer_id: (await supabase.auth.getUser()).data.user?.id,
              });

              if (error) throw error;

              Alert.alert('Success', `Request ${newStatus} successfully`);
              setShowDetailModal(false);
              loadRequests();
            } catch (error: any) {
              console.error('Error updating request:', error);
              Alert.alert('Error', 'Failed to update request');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getModificationTypeIcon = (type: string) => {
    switch (type) {
      case 'cancellation': return 'close-circle';
      case 'date_change': return 'calendar';
      case 'passenger_change': return 'people';
      case 'destination_change': return 'location';
      case 'package_upgrade': return 'arrow-up-circle';
      case 'package_downgrade': return 'arrow-down-circle';
      default: return 'create';
    }
  };

  const getModificationTypeColor = (type: string) => {
    switch (type) {
      case 'cancellation': return 'bg-red-500';
      case 'date_change': return 'bg-blue-500';
      case 'passenger_change': return 'bg-purple-500';
      case 'destination_change': return 'bg-orange-500';
      case 'package_upgrade': return 'bg-green-500';
      case 'package_downgrade': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyText = (hours: number) => {
    if (hours <= 0) return 'Journey started';
    if (hours < 24) return `${Math.floor(hours)}h until journey`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} until journey`;
  };

  if (showDetailModal && selectedRequest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-indigo-500 px-6 py-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => setShowDetailModal(false)} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-extrabold text-white mb-1">
                {selectedRequest.request_number}
              </Text>
              <Text className="text-indigo-100 text-sm capitalize">
                {selectedRequest.modification_type.replace('_', ' ')}
              </Text>
            </View>
            {selectedRequest.is_urgent && (
              <View className="bg-red-600 rounded-full px-3 py-1">
                <Text className="text-white font-bold text-xs">URGENT</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Customer Info */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-3">Customer Information</Text>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="person" size={18} color="#6366f1" />
              <Text className="ml-2 text-gray-900 font-semibold">{selectedRequest.customer_name}</Text>
            </View>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="mail" size={18} color="#6366f1" />
              <Text className="ml-2 text-gray-600">{selectedRequest.customer_email}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time" size={18} color="#6366f1" />
              <Text className="ml-2 text-gray-600">
                Requested: {formatDate(selectedRequest.requested_at)}
              </Text>
            </View>
          </View>

          {/* Journey Details */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-3">Journey Details</Text>
            <View className="bg-blue-50 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-700 font-semibold">Destination</Text>
                <Text className="text-blue-900 font-bold">
                  {selectedRequest.journey_details?.destination || 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-700 font-semibold">Start Date</Text>
                <Text className="text-gray-900">
                  {selectedRequest.journey_details?.start_date
                    ? new Date(selectedRequest.journey_details.start_date).toLocaleDateString('en-IN')
                    : 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 font-semibold">Time Until Journey</Text>
                <Text className={`font-bold ${
                  selectedRequest.hours_until_journey < 48 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {getUrgencyText(selectedRequest.hours_until_journey)}
                </Text>
              </View>
            </View>
          </View>

          {/* Financial Impact */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-3">Financial Impact</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Original Amount</Text>
                <Text className="font-bold text-gray-900">
                  {formatPrice(selectedRequest.original_amount)}
                </Text>
              </View>
              {selectedRequest.refund_amount > 0 && (
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600">Refund Amount</Text>
                  <Text className="font-bold text-green-600">
                    {formatPrice(selectedRequest.refund_amount)}
                  </Text>
                </View>
              )}
              {selectedRequest.net_amount !== selectedRequest.original_amount && (
                <View className="flex-row justify-between py-3 mt-2 bg-purple-50 px-3 rounded-xl">
                  <Text className="font-bold text-purple-900">Net Amount</Text>
                  <Text className="font-extrabold text-purple-900 text-lg">
                    {formatPrice(selectedRequest.net_amount)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Review Section */}
          {selectedRequest.status === 'pending' && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-800 mb-3">Review & Decision</Text>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Review Notes {selectedRequest.modification_type === 'cancellation' ? '(Optional)' : '(Required for rejection)'}
                </Text>
                <TextInput
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-row gap-3">
                {/* Approve Button */}
                <TouchableOpacity
                  onPress={() => updateRequestStatus('approved')}
                  disabled={processing}
                  className="flex-1 bg-green-500 rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                      <Text className="text-white font-extrabold ml-2">Approve</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Reject Button */}
                <TouchableOpacity
                  onPress={() => updateRequestStatus('rejected')}
                  disabled={processing}
                  className="flex-1 bg-red-500 rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={22} color="#fff" />
                      <Text className="text-white font-extrabold ml-2">Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Status Badge */}
          {selectedRequest.status !== 'pending' && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
              <View className="flex-row items-center justify-center">
                <View className={`${
                  selectedRequest.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                } px-6 py-3 rounded-2xl`}>
                  <Text className={`font-extrabold text-lg capitalize ${
                    selectedRequest.status === 'approved' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {selectedRequest.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-indigo-500 px-6 py-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Modification Requests
            </Text>
            <Text className="text-indigo-100 text-sm">
              {requests.length} {selectedStatus} request{requests.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {['pending', 'approved', 'rejected', 'processing'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
                className={`px-5 py-2 rounded-xl ${
                  selectedStatus === status ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <Text className={`font-bold capitalize ${
                  selectedStatus === status ? 'text-indigo-600' : 'text-white'
                }`}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-gray-600 mt-4 font-semibold">Loading requests...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
        >
          {requests.map((request) => (
            <TouchableOpacity
              key={request.request_id}
              onPress={() => openRequestDetail(request)}
              className="bg-white rounded-3xl p-6 mb-4 shadow-lg"
            >
              {/* Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className={`${getModificationTypeColor(request.modification_type)} rounded-full p-2 mr-2`}>
                      <Ionicons name={getModificationTypeIcon(request.modification_type) as any} size={16} color="#fff" />
                    </View>
                    <Text className="text-lg font-extrabold text-gray-900 flex-1">
                      {request.request_number}
                    </Text>
                  </View>
                  <Text className="text-gray-600 capitalize">
                    {request.modification_type.replace('_', ' ')}
                  </Text>
                </View>
                <View className={`${getPriorityColor(request.priority)} px-3 py-1 rounded-full`}>
                  <Text className="text-white text-xs font-extrabold uppercase">{request.priority}</Text>
                </View>
              </View>

              {/* Customer */}
              <View className="flex-row items-center mb-2">
                <Ionicons name="person" size={16} color="#6b7280" />
                <Text className="ml-2 text-gray-700 font-semibold">{request.customer_name}</Text>
              </View>

              {/* Journey Urgency */}
              {request.is_urgent && (
                <View className="bg-red-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="alert-circle" size={18} color="#dc2626" />
                    <Text className="ml-2 text-red-700 font-bold text-sm">
                      {getUrgencyText(request.hours_until_journey)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Financial Summary */}
              <View className="bg-purple-50 rounded-xl p-3 mb-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-semibold">Net Amount</Text>
                  <Text className="text-purple-900 font-extrabold text-lg">
                    {formatPrice(request.net_amount)}
                  </Text>
                </View>
                {request.refund_amount > 0 && (
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-gray-600 text-sm">Refund</Text>
                    <Text className="text-green-600 font-bold text-sm">
                      {formatPrice(request.refund_amount)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Timestamp */}
              <Text className="text-gray-400 text-xs">
                Requested: {formatDate(request.requested_at)}
              </Text>
            </TouchableOpacity>
          ))}

          {requests.length === 0 && (
            <View className="items-center justify-center py-20">
              <Ionicons name="checkmark-done-circle" size={64} color="#d1d5db" />
              <Text className="text-gray-400 font-bold text-lg mt-4">
                No {selectedStatus} requests
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

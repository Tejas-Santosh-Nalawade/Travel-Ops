/**
 * Policy Management Screen - Admin Dashboard
 * Manage cancellation, refund, and modification policies
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type CancellationPolicy = {
  policy_id: string;
  policy_name: string;
  policy_type: string;
  description: string;
  hours_before_min: number;
  hours_before_max: number | null;
  refund_percentage: number;
  cancellation_fee: number;
  allow_date_change: boolean;
  date_change_fee: number;
  is_active: boolean;
  priority: number;
};

export default function PolicyManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CancellationPolicy | null>(null);

  // Form state
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState('standard');
  const [description, setDescription] = useState('');
  const [hoursMin, setHoursMin] = useState('');
  const [hoursMax, setHoursMax] = useState('');
  const [refundPercentage, setRefundPercentage] = useState('');
  const [cancellationFee, setCancellationFee] = useState('');
  const [allowDateChange, setAllowDateChange] = useState(true);
  const [dateChangeFee, setDateChangeFee] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState('');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_cancellation_policies', {
        p_active_only: false,
      });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error: any) {
      console.error('Error loading policies:', error);
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (policy: CancellationPolicy) => {
    setEditingPolicy(policy);
    setPolicyName(policy.policy_name);
    setPolicyType(policy.policy_type);
    setDescription(policy.description || '');
    setHoursMin(policy.hours_before_min.toString());
    setHoursMax(policy.hours_before_max?.toString() || '');
    setRefundPercentage(policy.refund_percentage.toString());
    setCancellationFee(policy.cancellation_fee.toString());
    setAllowDateChange(policy.allow_date_change);
    setDateChangeFee(policy.date_change_fee.toString());
    setIsActive(policy.is_active);
    setPriority(policy.priority.toString());
    setShowForm(true);
  };

  const openNewForm = () => {
    setEditingPolicy(null);
    setPolicyName('');
    setPolicyType('standard');
    setDescription('');
    setHoursMin('');
    setHoursMax('');
    setRefundPercentage('');
    setCancellationFee('');
    setAllowDateChange(true);
    setDateChangeFee('');
    setIsActive(true);
    setPriority('');
    setShowForm(true);
  };

  const savePolicy = async () => {
    if (!policyName || !hoursMin || !refundPercentage || !cancellationFee) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('upsert_cancellation_policy', {
        p_policy_id: editingPolicy?.policy_id || null,
        p_policy_name: policyName,
        p_policy_type: policyType,
        p_description: description,
        p_hours_before_min: parseInt(hoursMin),
        p_hours_before_max: hoursMax ? parseInt(hoursMax) : null,
        p_refund_percentage: parseFloat(refundPercentage),
        p_cancellation_fee: parseFloat(cancellationFee),
        p_allow_date_change: allowDateChange,
        p_date_change_fee: parseFloat(dateChangeFee || '0'),
        p_is_active: isActive,
        p_priority: parseInt(priority || '0'),
      });

      if (error) throw error;

      Alert.alert('Success', editingPolicy ? 'Policy updated successfully' : 'Policy created successfully');
      setShowForm(false);
      loadPolicies();
    } catch (error: any) {
      console.error('Error saving policy:', error);
      Alert.alert('Error', 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'flexible': return 'bg-green-500';
      case 'premium': return 'bg-purple-500';
      case 'standard': return 'bg-blue-500';
      case 'non_refundable': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatHoursRange = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ hours before`;
    }
    if (min === 0 && max === 24) {
      return 'Within 24 hours';
    }
    const minDays = Math.floor(min / 24);
    const maxDays = max ? Math.floor(max / 24) : null;
    if (maxDays) {
      return `${minDays}-${maxDays} days before`;
    }
    return `${minDays}+ days before`;
  };

  if (showForm) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-purple-500 px-6 py-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => setShowForm(false)} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-extrabold text-white mb-1">
                {editingPolicy ? 'Edit Policy' : 'New Policy'}
              </Text>
              <Text className="text-purple-100 text-sm">Configure cancellation rules</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-3xl p-6 shadow-lg">
            {/* Policy Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Policy Name *</Text>
              <TextInput
                placeholder="e.g., Flexible - 7+ days before"
                value={policyName}
                onChangeText={setPolicyName}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Policy Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Policy Type *</Text>
              <View className="flex-row flex-wrap gap-2">
                {['flexible', 'standard', 'premium', 'non_refundable'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setPolicyType(type)}
                    className={`px-4 py-2 rounded-xl ${
                      policyType === type ? 'bg-purple-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`font-bold capitalize ${
                      policyType === type ? 'text-white' : 'text-gray-700'
                    }`}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <TextInput
                placeholder="Brief description of this policy"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Time Range */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Time Range (Hours Before Journey) *</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">Minimum</Text>
                  <TextInput
                    placeholder="0"
                    keyboardType="numeric"
                    value={hoursMin}
                    onChangeText={setHoursMin}
                    className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900 font-bold"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">Maximum (optional)</Text>
                  <TextInput
                    placeholder="NULL = no limit"
                    keyboardType="numeric"
                    value={hoursMax}
                    onChangeText={setHoursMax}
                    className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900 font-bold"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>

            {/* Refund Percentage */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Refund Percentage * (0-100)</Text>
              <TextInput
                placeholder="75"
                keyboardType="numeric"
                value={refundPercentage}
                onChangeText={setRefundPercentage}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Cancellation Fee */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Cancellation Fee (₹) *</Text>
              <TextInput
                placeholder="1000"
                keyboardType="numeric"
                value={cancellationFee}
                onChangeText={setCancellationFee}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Date Change Options */}
            <View className="mb-4 bg-blue-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-gray-700">Allow Date Changes</Text>
                <Switch
                  value={allowDateChange}
                  onValueChange={setAllowDateChange}
                  trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
                  thumbColor={allowDateChange ? '#8b5cf6' : '#f3f4f6'}
                />
              </View>
              {allowDateChange && (
                <View>
                  <Text className="text-xs text-gray-600 mb-1">Date Change Fee (₹)</Text>
                  <TextInput
                    placeholder="500"
                    keyboardType="numeric"
                    value={dateChangeFee}
                    onChangeText={setDateChangeFee}
                    className="bg-white rounded-xl px-4 py-3 border border-blue-200 text-gray-900 font-bold"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}
            </View>

            {/* Priority */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Priority (lower = checked first)</Text>
              <TextInput
                placeholder="0"
                keyboardType="numeric"
                value={priority}
                onChangeText={setPriority}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-purple-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Active Status */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-sm font-semibold text-gray-700">Active Policy</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
                thumbColor={isActive ? '#8b5cf6' : '#f3f4f6'}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={savePolicy}
              disabled={loading}
              className="bg-purple-500 rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save" size={22} color="#fff" />
                  <Text className="text-white font-extrabold ml-2 text-lg">
                    {editingPolicy ? 'Update Policy' : 'Create Policy'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-purple-500 px-6 py-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Policy Management
            </Text>
            <Text className="text-purple-100 text-sm">
              {policies.length} policies configured
            </Text>
          </View>
          <TouchableOpacity onPress={openNewForm} className="bg-white/20 rounded-full p-2">
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text className="text-gray-600 mt-4 font-semibold">Loading policies...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {policies.map((policy) => (
            <View key={policy.policy_id} className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
              {/* Header */}
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className={`${getPolicyTypeColor(policy.policy_type)} px-3 py-1 rounded-full`}>
                      <Text className="text-white text-xs font-extrabold uppercase">
                        {policy.policy_type}
                      </Text>
                    </View>
                    {!policy.is_active && (
                      <View className="bg-gray-400 px-3 py-1 rounded-full ml-2">
                        <Text className="text-white text-xs font-extrabold">INACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xl font-extrabold text-gray-900 mb-1">
                    {policy.policy_name}
                  </Text>
                  {policy.description && (
                    <Text className="text-gray-600 text-sm">{policy.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => openEditForm(policy)}
                  className="bg-purple-100 rounded-full p-2"
                >
                  <Ionicons name="create" size={20} color="#8b5cf6" />
                </TouchableOpacity>
              </View>

              {/* Details */}
              <View className="bg-purple-50 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={18} color="#8b5cf6" />
                    <Text className="ml-2 text-gray-700 font-semibold">Time Range</Text>
                  </View>
                  <Text className="text-purple-900 font-bold">
                    {formatHoursRange(policy.hours_before_min, policy.hours_before_max)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="cash" size={18} color="#10b981" />
                    <Text className="ml-2 text-gray-700 font-semibold">Refund</Text>
                  </View>
                  <Text className="text-green-600 font-bold text-lg">
                    {policy.refund_percentage}%
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="card" size={18} color="#ef4444" />
                    <Text className="ml-2 text-gray-700 font-semibold">Cancellation Fee</Text>
                  </View>
                  <Text className="text-red-600 font-bold">
                    ₹{policy.cancellation_fee.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Modification Rules */}
              {policy.allow_date_change && (
                <View className="bg-blue-50 rounded-xl p-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={16} color="#3b82f6" />
                      <Text className="ml-2 text-gray-700 text-sm">Date changes allowed</Text>
                    </View>
                    <Text className="text-blue-600 font-bold text-sm">
                      ₹{policy.date_change_fee.toLocaleString('en-IN')} fee
                    </Text>
                  </View>
                </View>
              )}

              {/* Priority Badge */}
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-gray-500 text-xs">Priority: {policy.priority}</Text>
                <Text className="text-gray-400 text-xs">
                  {policy.is_active ? '✓ Active' : '✗ Inactive'}
                </Text>
              </View>
            </View>
          ))}

          {policies.length === 0 && (
            <View className="items-center justify-center py-20">
              <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-400 font-bold text-lg mt-4">No policies configured</Text>
              <TouchableOpacity
                onPress={openNewForm}
                className="bg-purple-500 mt-4 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-bold">Create First Policy</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

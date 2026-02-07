import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, EmptyState, SectionHeader, InfoRow, ActionButton } from '../../component/ops/UIComponents';
import type { Journey, JourneyItem, MoneyExposure, OpsAlert, OpsAction } from '../../types/operations';

export default function JourneyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [exposure, setExposure] = useState<MoneyExposure | null>(null);
  const [alerts, setAlerts] = useState<OpsAlert[]>([]);
  const [actions, setActions] = useState<OpsAction[]>([]);
  
  const [actionModal, setActionModal] = useState(false);
  const [actionText, setActionText] = useState('');

  useEffect(() => {
    if (id) {
      loadJourneyDetails();
    }
  }, [id]);

  const loadJourneyDetails = async () => {
    try {
      setLoading(true);

      // Load journey
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', id)
        .single();

      if (journeyError) throw journeyError;
      setJourney(journeyData);

      // Load journey items
      const { data: itemsData, error: itemsError } = await supabase
        .from('journey_items')
        .select('*')
        .eq('journey_id', id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load money exposure
      const { data: exposureData, error: exposureError } = await supabase
        .from('money_exposure')
        .select('*')
        .eq('journey_id', id)
        .single();

      if (!exposureError) {
        setExposure(exposureData);
      }

      // Load alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('ops_alerts')
        .select('*')
        .eq('journey_id', id)
        .order('created_at', { ascending: false });

      if (!alertsError) {
        setAlerts(alertsData || []);
      }

      // Load actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('ops_actions')
        .select('*')
        .eq('journey_id', id)
        .order('executed_at', { ascending: false });

      if (!actionsError) {
        setActions(actionsData || []);
      }
    } catch (error) {
      console.error('Error loading journey details:', error);
      Alert.alert('Error', 'Failed to load journey details');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!actionText.trim()) {
      Alert.alert('Error', 'Please describe the action');
      return;
    }

    const { error } = await supabase.from('ops_actions').insert({
      journey_id: id,
      action: actionText,
      status: 'SUCCESS',
    });

    if (error) {
      Alert.alert('Error', 'Failed to record action');
      return;
    }

    Alert.alert('Success', 'Action recorded successfully');
    setActionModal(false);
    setActionText('');
    loadJourneyDetails();
  };

  const updateJourneyStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('journeys')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', 'Failed to update journey status');
      return;
    }

    Alert.alert('Success', 'Journey status updated');
    loadJourneyDetails();
  };

  const getItemIcon = (type: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      FLIGHT: 'airplane',
      HOTEL: 'bed',
      TRANSFER: 'car',
    };
    return icons[type] || 'cube';
  };

  const getItemColor = (type: string) => {
    const colors: Record<string, string> = {
      FLIGHT: '#3B82F6',
      HOTEL: '#8B5CF6',
      TRANSFER: '#10B981',
    };
    return colors[type] || '#6B7280';
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading journey details...</Text>
      </View>
    );
  }

  if (!journey) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4">Journey Not Found</Text>
        <TouchableOpacity 
          className="bg-blue-500 px-6 py-3 rounded-lg mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 flex-1">Journey Details</Text>
          <TouchableOpacity onPress={loadJourneyDetails}>
            <Ionicons name="refresh" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Journey Overview */}
        <View className="bg-white p-4 mb-2">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {journey.customer_name}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                ID: {journey.id.slice(0, 8)}...
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                Created: {new Date(journey.created_at).toLocaleString()}
              </Text>
            </View>
            <StatusBadge status={journey.status} size="lg" />
          </View>

          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <Text className="text-sm text-gray-600 mb-1">Total Cost</Text>
            <Text className="text-3xl font-bold text-blue-600">
              ${journey.total_cost?.toFixed(2) || '0.00'}
            </Text>
          </View>

          {/* Status Actions */}
          {(journey.status === 'PENDING' || journey.status === 'FAILED') && (
            <View className="space-y-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-green-500 px-4 py-2 rounded-lg flex-1"
                  onPress={() => updateJourneyStatus('CONFIRMED')}
                >
                  <Text className="text-white text-center font-semibold">Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-orange-500 px-4 py-2 rounded-lg flex-1"
                  onPress={() => updateJourneyStatus('ON_HOLD')}
                >
                  <Text className="text-white text-center font-semibold">Hold</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-500 px-4 py-2 rounded-lg flex-1"
                  onPress={() => updateJourneyStatus('CANCELLED')}
                >
                  <Text className="text-white text-center font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Money Exposure */}
        {exposure && (
          <View className="bg-white p-4 mb-2">
            <SectionHeader title="Financial Exposure" />
            <View className="flex-row mb-3">
              <View className="flex-1 bg-green-50 border border-green-300 rounded-lg p-3 mr-2">
                <Text className="text-xs text-green-700 mb-1">Confirmed</Text>
                <Text className="text-xl font-bold text-green-800">
                  ${exposure.confirmed_amount?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <View className="flex-1 bg-yellow-50 border border-yellow-300 rounded-lg p-3 ml-2">
                <Text className="text-xs text-yellow-700 mb-1">Pending</Text>
                <Text className="text-xl font-bold text-yellow-800">
                  ${exposure.pending_amount?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3">
              <Text className="text-sm text-gray-600">Risk Level</Text>
              <StatusBadge status={exposure.risk_level} />
            </View>
          </View>
        )}

        {/* Journey Items */}
        <View className="bg-white p-4 mb-2">
          <SectionHeader title={`Journey Items (${items.length})`} />
          {items.length > 0 ? (
            items.map((item) => (
              <View key={item.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-start flex-1">
                    <View
                      style={{ backgroundColor: getItemColor(item.type) }}
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    >
                      <Ionicons name={getItemIcon(item.type)} size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800">{item.type}</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        ${item.cost?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                {item.details && Object.keys(item.details).length > 0 && (
                  <View className="bg-white rounded p-3 mt-2">
                    <Text className="text-xs font-semibold text-gray-700 mb-2">Details</Text>
                    {Object.entries(item.details).map(([key, value]) => (
                      <InfoRow
                        key={key}
                        label={key.replace(/_/g, ' ').toUpperCase()}
                        value={String(value)}
                      />
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No items"
              subtitle="This journey has no items yet"
            />
          )}
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View className="bg-white p-4 mb-2">
            <SectionHeader title={`Alerts (${alerts.length})`} />
            {alerts.map((alert) => (
              <View key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      <Text className="ml-2 font-semibold text-gray-800">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={alert.status} size="sm" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions History */}
        <View className="bg-white p-4 mb-2">
          <SectionHeader
            title={`Actions History (${actions.length})`}
            actionLabel="+ Add Action"
            onActionPress={() => setActionModal(true)}
          />
          {actions.length > 0 ? (
            actions.map((action) => (
              <View key={action.id} className="bg-gray-50 rounded-lg p-4 mb-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{action.action}</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {new Date(action.executed_at).toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={action.status} size="sm" />
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              icon="list-outline"
              title="No actions recorded"
              subtitle="Add actions as you work on this journey"
            />
          )}
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={actionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-800 mb-4">Record Action</Text>

            <Text className="text-sm text-gray-600 mb-2">Action Description</Text>
            <TextInput
              className="bg-gray-100 rounded-lg p-3 mb-4 h-32"
              placeholder="Describe what you did..."
              value={actionText}
              onChangeText={setActionText}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-300 py-3 rounded-lg"
                onPress={() => setActionModal(false)}
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-3 rounded-lg"
                onPress={executeAction}
              >
                <Text className="text-center font-semibold text-white">Save Action</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

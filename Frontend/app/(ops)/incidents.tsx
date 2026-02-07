import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, EmptyState, SectionHeader, AlertCard } from '../../component/ops/UIComponents';
import type { Incident, AdminNotification } from '../../types/operations';

export default function IncidentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [createModal, setCreateModal] = useState(false);
  const [incidentType, setIncidentType] = useState('SUPPLIER_OUTAGE');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadIncidents(), loadNotifications()]);
    } catch (error) {
      console.error('Error loading incidents:', error);
      Alert.alert('Error', 'Failed to load incidents data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadIncidents = async () => {
    let query = supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'ALL') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    setIncidents(data || []);
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    setNotifications(data || []);
  };

  const createIncident = async () => {
    if (!incidentType) {
      Alert.alert('Error', 'Please select incident type');
      return;
    }

    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .insert({
        incident_type: incidentType,
        status: 'OPEN',
      })
      .select()
      .single();

    if (incidentError) {
      Alert.alert('Error', 'Failed to create incident');
      return;
    }

    // Create notification if message provided
    if (notificationMessage.trim()) {
      await supabase.from('admin_notifications').insert({
        incident_id: incidentData.id,
        message: notificationMessage,
        status: 'SENT',
      });
    }

    Alert.alert('Success', 'Incident created successfully');
    setCreateModal(false);
    setNotificationMessage('');
    loadData();
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('incidents')
      .update({ status: newStatus })
      .eq('id', incidentId);

    if (error) {
      Alert.alert('Error', 'Failed to update incident');
      return;
    }

    Alert.alert('Success', 'Incident status updated');
    loadData();
  };

  const acknowledgeNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ status: 'ACKNOWLEDGED' })
      .eq('id', notificationId);

    if (error) {
      Alert.alert('Error', 'Failed to acknowledge notification');
      return;
    }

    loadData();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getIncidentIcon = (type: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      SUPPLIER_OUTAGE: 'cloud-offline',
      PAYMENT_FAILURE: 'card',
      PRICE_SPIKE: 'trending-up',
      SYSTEM_DEGRADATION: 'warning',
    };
    return icons[type] || 'alert-circle';
  };

  const getIncidentColor = (type: string) => {
    const colors: Record<string, string> = {
      SUPPLIER_OUTAGE: '#EF4444',
      PAYMENT_FAILURE: '#F59E0B',
      PRICE_SPIKE: '#8B5CF6',
      SYSTEM_DEGRADATION: '#DC2626',
    };
    return colors[type] || '#6B7280';
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === 'OPEN').length,
    mitigating: incidents.filter((i) => i.status === 'MITIGATING').length,
    resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading incidents...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">Incidents</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            onPress={() => setCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Create</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View className="flex-row">
          <View className="flex-1 bg-gray-50 rounded-lg p-3 mr-2">
            <Text className="text-xs text-gray-600">Open</Text>
            <Text className="text-2xl font-bold text-red-600">{stats.open}</Text>
          </View>
          <View className="flex-1 bg-gray-50 rounded-lg p-3 mx-1">
            <Text className="text-xs text-gray-600">Mitigating</Text>
            <Text className="text-2xl font-bold text-orange-600">{stats.mitigating}</Text>
          </View>
          <View className="flex-1 bg-gray-50 rounded-lg p-3 ml-2">
            <Text className="text-xs text-gray-600">Resolved</Text>
            <Text className="text-2xl font-bold text-green-600">{stats.resolved}</Text>
          </View>
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-2">
          <View className="flex-row px-2">
            {['ALL', 'OPEN', 'MITIGATING', 'RESOLVED'].map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2 rounded-lg mr-2 ${
                  filterStatus === status ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                onPress={() => {
                  setFilterStatus(status);
                  loadIncidents();
                }}
              >
                <Text
                  className={`font-semibold ${
                    filterStatus === status ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Incidents List */}
        <View className="p-4">
          {incidents.length > 0 ? (
            incidents.map((incident) => (
              <View key={incident.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-start flex-1">
                    <View
                      style={{ backgroundColor: getIncidentColor(incident.incident_type) }}
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    >
                      <Ionicons
                        name={getIncidentIcon(incident.incident_type)}
                        size={24}
                        color="white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-lg text-gray-800">
                        {incident.incident_type.replace(/_/g, ' ')}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {new Date(incident.created_at).toLocaleString()}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {incident.id.slice(0, 8)}...
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={incident.status} />
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                  {incident.status === 'OPEN' && (
                    <TouchableOpacity
                      className="flex-1 bg-orange-500 py-2 rounded-lg"
                      onPress={() => updateIncidentStatus(incident.id, 'MITIGATING')}
                    >
                      <Text className="text-white text-center font-semibold">Start Mitigation</Text>
                    </TouchableOpacity>
                  )}
                  {incident.status === 'MITIGATING' && (
                    <TouchableOpacity
                      className="flex-1 bg-green-500 py-2 rounded-lg"
                      onPress={() => updateIncidentStatus(incident.id, 'RESOLVED')}
                    >
                      <Text className="text-white text-center font-semibold">Mark Resolved</Text>
                    </TouchableOpacity>
                  )}
                  {incident.status === 'RESOLVED' && (
                    <View className="flex-1 bg-gray-100 py-2 rounded-lg">
                      <Text className="text-gray-500 text-center font-semibold">Resolved</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              icon="checkmark-circle"
              title="No incidents found"
              subtitle="All clear! No incidents match your filter."
            />
          )}
        </View>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <View className="p-4">
            <SectionHeader title="Recent Notifications" />
            {notifications.slice(0, 5).map((notification) => (
              <View key={notification.id} className="bg-white rounded-lg p-4 mb-2 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-800">{notification.message}</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={notification.status} size="sm" />
                </View>
                {notification.status === 'SENT' && (
                  <TouchableOpacity
                    className="bg-blue-500 py-2 rounded-lg mt-2"
                    onPress={() => acknowledgeNotification(notification.id)}
                  >
                    <Text className="text-white text-center font-semibold">Acknowledge</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Create Incident Modal */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-800 mb-4">Create Incident</Text>

            <Text className="text-sm text-gray-600 mb-2">Incident Type</Text>
            <View className="flex-row flex-wrap mb-4">
              {[
                'SUPPLIER_OUTAGE',
                'PAYMENT_FAILURE',
                'PRICE_SPIKE',
                'SYSTEM_DEGRADATION',
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                    incidentType === type ? 'bg-red-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setIncidentType(type)}
                >
                  <Text
                    className={`text-sm ${incidentType === type ? 'text-white' : 'text-gray-700'}`}
                  >
                    {type.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm text-gray-600 mb-2">Notification Message (Optional)</Text>
            <TextInput
              className="bg-gray-100 rounded-lg p-3 mb-4 h-24"
              placeholder="Enter notification message..."
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-300 py-3 rounded-lg"
                onPress={() => setCreateModal(false)}
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 py-3 rounded-lg"
                onPress={createIncident}
              >
                <Text className="text-center font-semibold text-white">Create Incident</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

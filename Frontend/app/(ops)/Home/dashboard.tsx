import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  GradientHeader,
  StatCard,
  StatusBadge,
  ActionButton,
  AlertCard,
  SectionHeader,
  EmptyState,
  MoneyDisplay,
  RiskIndicator,
} from '../../../component/UIKit';
import {
  getOperationsStatistics,
  getCriticalJourneys,
  getExposureSummary,
  executeOpsDecision,
  updateAlertStatus,
  updateIncidentStatus,
  getAlerts,
  getIncidents,
  getDecisions,
  getMoneyExposure,
} from '../../../lib/operationsApi';

type Journey = {
  id: string;
  customer_name: string;
  status: string;
  total_cost: number;
  created_at: string;
  created_by: string;
};

type OpsAlert = {
  id: string;
  journey_id: string;
  alert_type: string;
  status: string;
  created_at: string;
  journeys?: { customer_name: string };
};

type Incident = {
  id: string;
  incident_type: string;
  status: string;
  created_at: string;
};

type MoneyExposure = {
  id: string;
  journey_id: string;
  confirmed_amount: number;
  pending_amount: number;
  customer_budget?: number;
  risk_level: string;
  created_at: string;
};

type Decision = {
  id: string;
  journey_id: string;
  decision: string;
  notes: string;
  created_at: string;
  journeys?: { customer_name: string };
};

// Simple Card Component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 ${className}`}>
    {children}
  </View>
);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [alerts, setAlerts] = useState<OpsAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [moneyExposure, setMoneyExposure] = useState<MoneyExposure[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  // Modal states
  const [decisionModal, setDecisionModal] = useState(false);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [decisionType, setDecisionType] = useState('RETRY');
  const [decisionNotes, setDecisionNotes] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalJourneys: 0,
    activeAlerts: 0,
    openIncidents: 0,
    totalExposure: 0,
    highRiskJourneys: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Use optimized backend functions
      const [statsData, alertsData, incidentsData, exposureData, decisionsData] = await Promise.all([
        getOperationsStatistics(),
        getAlerts({ status: 'OPEN,IN_PROGRESS' }),
        getIncidents({ status: 'OPEN,MITIGATING' }),
        getMoneyExposure(),
        getDecisions(10),
      ]);

      // Update state
      setStats({
        totalJourneys: statsData.total_journeys || 0,
        activeAlerts: statsData.active_alerts || 0,
        openIncidents: statsData.open_incidents || 0,
        totalExposure: statsData.total_exposure || 0,
        highRiskJourneys: statsData.high_risk_count || 0,
      });

      setAlerts(alertsData);
      setIncidents(incidentsData);
      setMoneyExposure(exposureData);
      setDecisions(decisionsData);

      // Load critical journeys for the journeys tab
      const criticalData = await getCriticalJourneys();
      setJourneys(criticalData || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleAlertAction = async (alertId: string, newStatus: string) => {
    try {
      await updateAlertStatus(alertId, newStatus as any);
      Alert.alert('Success', 'Alert updated successfully');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert');
    }
  };

  const handleIncidentAction = async (incidentId: string, newStatus: string) => {
    try {
      await updateIncidentStatus(incidentId, newStatus as any);
      Alert.alert('Success', 'Incident updated successfully');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update incident');
    }
  };

  const submitDecision = async () => {
    if (!selectedJourneyId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Use the backend function for decision execution
      await executeOpsDecision(
        selectedJourneyId,
        decisionType as any,
        userData.user.id,
        decisionNotes
      );

      Alert.alert('Success', 'Decision recorded and action executed');
      setDecisionModal(false);
      setDecisionNotes('');
      setSelectedJourneyId(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error submitting decision:', error);
      Alert.alert('Error', 'Failed to submit decision');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', 'Failed to logout');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred during logout');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderOverview = () => (
    <View className="flex-1">
      <GradientHeader
        title="Operations Control Center"
        subtitle={`Last updated: ${new Date().toLocaleTimeString()}`}
      />

      <View className="px-4 pt-4">
        {/* Key Metrics - Improved Layout */}
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              title="Total Journeys"
              value={stats.totalJourneys}
              icon="airplane"
              iconColor="#3B82F6"
              iconBg="bg-blue-100"
              subtitle="All bookings"
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              title="Active Alerts"
              value={stats.activeAlerts}
              icon="alert-circle"
              iconColor="#EF4444"
              iconBg="bg-red-100"
              trend={stats.activeAlerts > 5 ? { value: Math.floor((stats.activeAlerts - 5) / 5 * 100), isPositive: false } : undefined}
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              title="Open Incidents"
              value={stats.openIncidents}
              icon="warning"
              iconColor="#F59E0B"
              iconBg="bg-orange-100"
              subtitle={stats.openIncidents > 0 ? "Needs attention" : "All clear"}
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              title="Total Exposure"
              value={`₹${(stats.totalExposure / 1000).toFixed(1)}k`}
              icon="cash"
              iconColor="#10B981"
              iconBg="bg-green-100"
              subtitle="Financial risk"
            />
          </View>
        </View>

        {/* High Risk Alert - Enhanced */}
        {stats.highRiskJourneys > 0 && (
          <View className="mb-6">
            <AlertCard
              type="error"
              title="⚠️ High Risk Alert"
              message={`${stats.highRiskJourneys} journey${stats.highRiskJourneys > 1 ? 's' : ''} require immediate attention. Review financial exposure now.`}
              action={{
                label: 'View Details',
                onPress: () => setActiveTab('exposure')
              }}
            />
          </View>
        )}

        {/* Recent Alerts - Improved Design */}
        <View className="mb-6">
          <SectionHeader
            title="🚨 Recent Alerts"
            subtitle={alerts.length > 0 ? `${alerts.length} active` : 'All clear'}
            action={alerts.length > 3 ? { label: 'View All', onPress: () => { } } : undefined}
          />

          {alerts.length > 0 ? (
            alerts.slice(0, 3).map((alertItem: OpsAlert, index: number) => (
              <Card key={alertItem.id || `alert-${index}`}>
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="font-bold text-gray-900 text-base mb-1">
                      {alertItem.alert_type.replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-1">
                      Customer: {alertItem.journeys?.customer_name || 'Unknown'}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(alertItem.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={alertItem.status} size="sm" />
                </View>
                <View className="flex-row gap-2 mt-2">
                  <View className="flex-1">
                    <ActionButton
                      title="Start"
                      onPress={() => handleAlertAction(alertItem.id, 'IN_PROGRESS')}
                      variant="primary"
                      icon="play"
                      size="sm"
                    />
                  </View>
                  <View className="flex-1">
                    <ActionButton
                      title="Resolve"
                      onPress={() => handleAlertAction(alertItem.id, 'RESOLVED')}
                      variant="success"
                      icon="checkmark"
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              icon="checkmark-done-circle"
              title="All Clear!"
              subtitle="No active alerts at the moment. Great job team!"
            />
          )}
        </View>

        {/* Recent Incidents - Enhanced */}
        <View className="mb-6">
          <SectionHeader
            title="⚡ Active Incidents"
            subtitle={incidents.length > 0 ? `${incidents.length} requiring action` : 'No incidents'}
            action={incidents.length > 0 ? { label: 'Manage All', onPress: () => router.push('/(ops)/incidents') } : undefined}
          />

          {incidents.length > 0 ? (
            incidents.map((incident, index) => (
              <Card key={incident.id || `incident-${index}`}>
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="font-bold text-gray-900 text-base mb-1">
                      {incident.incident_type.replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Created {new Date(incident.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <StatusBadge status={incident.status} size="sm" />
                </View>
                <View className="flex-row gap-2 mt-2">
                  <View className="flex-1">
                    <ActionButton
                      title="Mitigate"
                      onPress={() => handleIncidentAction(incident.id, 'MITIGATING')}
                      variant="secondary"
                      icon="construct"
                      size="sm"
                    />
                  </View>
                  <View className="flex-1">
                    <ActionButton
                      title="Resolve"
                      onPress={() => handleIncidentAction(incident.id, 'RESOLVED')}
                      variant="success"
                      icon="checkmark-circle"
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              icon="shield-checkmark"
              title="No Incidents"
              subtitle="System is running smoothly"
            />
          )}
        </View>

        <View className="h-6" />
      </View>
    </View>
  );

  const renderJourneys = () => (
    <View className="flex-1">
      <GradientHeader
        title="Journey Management"
        subtitle="Monitor all travel bookings"
      />

      <View className="px-4 pt-4">
        <SectionHeader
          title="All Journeys"
          subtitle={`${journeys.length} total`}
        />

        {journeys.length > 0 ? (
          journeys.map((journey, index) => (
            <TouchableOpacity
              key={journey.id || `journey-${index}`}
              onPress={() => {
                Alert.alert(
                  'Journey Details',
                  `View details for ${journey.customer_name}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'View',
                      onPress: () => Alert.alert('Journey ID', journey.id),
                    },
                  ]
                );
              }}
            >
              <Card>
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-lg text-gray-900 mb-1">
                      {journey.customer_name || 'Unknown Customer'}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-1">
                      ID: {journey.id ? journey.id.slice(0, 8) + '...' : 'N/A'}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {journey.created_at ? new Date(journey.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <StatusBadge status={journey.status} />
                    <View className="mt-2">
                      <MoneyDisplay amount={journey.total_cost || 0} size="lg" />
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <Ionicons name="eye" size={16} color="#3B82F6" />
                  <Text className="ml-2 text-sm text-blue-500 font-medium">Tap to view details</Text>
                </View>
                <View className="mt-3">
                  <ActionButton
                    title="Manage Journey"
                    onPress={() => router.push({
                      pathname: '/(ops)/Home/decision',
                      params: { journeyId: journey.id }
                    })}
                    variant="primary"
                    icon="create"
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="airplane-outline"
            title="No Journeys"
            subtitle="No journeys to display"
          />
        )}

        <View className="h-6" />
      </View>
    </View>
  );

  const renderMoneyExposure = () => {
    const totalConfirmed = moneyExposure.reduce((sum, exp) => sum + (exp.confirmed_amount || 0), 0);
    const totalPending = moneyExposure.reduce((sum, exp) => sum + (exp.pending_amount || 0), 0);
    const highRiskCount = moneyExposure.filter(e => e.risk_level === 'HIGH').length;
    const mediumRiskCount = moneyExposure.filter(e => e.risk_level === 'MEDIUM').length;

    return (
      <View className="flex-1">
        <GradientHeader
          title="💰 Money Exposure Tracking"
          subtitle="Real-time financial risk monitoring"
        />

        <View className="px-4 pt-4">
          {/* Financial Summary Cards - Enhanced */}
          <View className="flex-row mb-6 gap-3">
            <View className="flex-1">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <View className="flex-row items-center mb-2">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-2">
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  </View>
                  <Text className="text-sm text-green-700 font-medium">Confirmed</Text>
                </View>
                <MoneyDisplay amount={totalConfirmed} size="lg" />
                <Text className="text-xs text-green-600 mt-1">Secured bookings</Text>
              </Card>
            </View>
            <View className="flex-1">
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                <View className="flex-row items-center mb-2">
                  <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-2">
                    <Ionicons name="time" size={20} color="#d97706" />
                  </View>
                  <Text className="text-sm text-yellow-700 font-medium">Pending</Text>
                </View>
                <MoneyDisplay amount={totalPending} size="lg" />
                <Text className="text-xs text-yellow-600 mt-1">Awaiting confirmation</Text>
              </Card>
            </View>
          </View>

          {/* Risk Distribution */}
          {(highRiskCount > 0 || mediumRiskCount > 0) && (
            <View className="mb-6">
              <Card className="bg-red-50 border-red-200">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-bold text-red-900">Risk Distribution</Text>
                  <View className="flex-row gap-2">
                    {highRiskCount > 0 && (
                      <View className="bg-red-200 px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold text-red-700">{highRiskCount} HIGH</Text>
                      </View>
                    )}
                    {mediumRiskCount > 0 && (
                      <View className="bg-yellow-200 px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold text-yellow-700">{mediumRiskCount} MEDIUM</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text className="text-sm text-red-700">
                  {highRiskCount + mediumRiskCount} journey{highRiskCount + mediumRiskCount > 1 ? 's' : ''} require financial review
                </Text>
              </Card>
            </View>
          )}

          <SectionHeader
            title="Active Exposures"
            subtitle={`${moneyExposure.length} journeys tracked`}
          />

          {/* Exposure Details - Enhanced */}
          {moneyExposure.length > 0 ? (
            moneyExposure.map((exposure, index) => {
              const borderColor = exposure.risk_level === 'HIGH' ? '#ef4444' : exposure.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';
              return (
                <View key={exposure.id || `exposure-${index}`} style={{ borderLeftWidth: 4, borderLeftColor: borderColor, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  <Card className="mb-0">
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Journey ID</Text>
                        <Text className="text-sm text-gray-700 font-mono">
                          {exposure.journey_id ? exposure.journey_id.slice(0, 8) + '...' : 'N/A'}
                        </Text>
                      </View>
                      <RiskIndicator level={exposure.risk_level as 'LOW' | 'MEDIUM' | 'HIGH'} />
                    </View>

                    <View className="bg-gray-50 rounded-lg p-3 mb-3">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500 mb-1">Confirmed</Text>
                          <MoneyDisplay amount={exposure.confirmed_amount || 0} size="sm" />
                        </View>
                        <View className="flex-1 mx-2">
                          <Text className="text-xs text-gray-500 mb-1">Pending</Text>
                          <MoneyDisplay amount={exposure.pending_amount || 0} size="sm" />
                        </View>
                        <View className="flex-1 items-end">
                          <Text className="text-xs text-gray-500 mb-1">Total</Text>
                          <Text className="text-lg font-bold text-gray-900">
                            ₹{((exposure.confirmed_amount || 0) + (exposure.pending_amount || 0)).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {exposure.customer_budget && (
                      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                        <Text className="text-xs text-gray-500">Customer Budget</Text>
                        <MoneyDisplay amount={exposure.customer_budget} size="sm" />
                      </View>
                    )}
                  </Card>
                </View>
              );
            })
          ) : (
            <EmptyState
              icon="cash-outline"
              title="No Active Exposures"
              subtitle="All financial exposures have been cleared"
            />
          )}

          <View className="h-6" />
        </View>
      </View>
    );
  };

  const renderDecisions = () => (
    <View className="flex-1">
      <GradientHeader
        title="Decision History"
        subtitle="Operations decisions log"
      />

      <View className="px-4 pt-4">
        <SectionHeader
          title="Recent Decisions"
          subtitle={`${decisions.length} recorded`}
        />

        {decisions.length > 0 ? (
          decisions.map((decision, index) => (
            <Card key={decision.id || `decision-${index}`}>
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text className="font-bold text-lg text-gray-900 ml-2">
                      {decision.decision}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600 mb-1">
                    {decision.journeys?.customer_name || 'Unknown Journey'}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(decision.created_at).toLocaleString()}
                  </Text>
                </View>
                <StatusBadge status="COMPLETED" />
              </View>
              {decision.notes && (
                <View className="bg-gray-50 p-3 rounded-lg mt-3">
                  <Text className="text-xs text-gray-500 mb-1 font-medium">Decision Notes:</Text>
                  <Text className="text-sm text-gray-700">{decision.notes}</Text>
                </View>
              )}
            </Card>
          ))
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No Decisions Yet"
            subtitle="No operational decisions recorded"
          />
        )}

        <View className="h-6" />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading operations data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Logout */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Operations Dashboard</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Monitor and manage all journeys</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 rounded-xl px-4 py-2 flex-row items-center gap-2"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-600 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          <View className="flex-row py-2">
            {[
              { key: 'overview', label: 'Overview', icon: 'grid' },
              { key: 'journeys', label: 'Journeys', icon: 'airplane' },
              { key: 'exposure', label: 'Exposure', icon: 'cash' },
              { key: 'decisions', label: 'Decisions', icon: 'checkmark-done' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                className={`px-4 py-2 mx-1 rounded-lg flex-row items-center ${activeTab === tab.key ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.key ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold ${activeTab === tab.key ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'journeys' && renderJourneys()}
        {activeTab === 'exposure' && renderMoneyExposure()}
        {activeTab === 'decisions' && renderDecisions()}
      </ScrollView>

      {/* Decision Modal */}
      <Modal
        visible={decisionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDecisionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-800 mb-4">Make Decision</Text>

            <Text className="text-sm text-gray-600 mb-2">Decision Type</Text>
            <View className="flex-row flex-wrap mb-4">
              {['RETRY', 'REPLACE', 'ROLLBACK', 'HOLD'].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-4 py-2 rounded-lg mr-2 mb-2 ${decisionType === type ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  onPress={() => setDecisionType(type)}
                >
                  <Text
                    className={`font-semibold ${decisionType === type ? 'text-white' : 'text-gray-700'
                      }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm text-gray-600 mb-2">Notes</Text>
            <TextInput
              className="bg-gray-100 rounded-lg p-3 mb-4 h-24"
              placeholder="Add decision notes..."
              value={decisionNotes}
              onChangeText={setDecisionNotes}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <ActionButton
                  title="Cancel"
                  onPress={() => setDecisionModal(false)}
                  variant="secondary"
                />
              </View>
              <View className="flex-1">
                <ActionButton
                  title="Submit Decision"
                  onPress={submitDecision}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

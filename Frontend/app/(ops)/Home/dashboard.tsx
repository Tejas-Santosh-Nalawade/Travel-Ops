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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null);
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([]);

  // Simulation states
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);

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
    transactionSuccessRate: 0,
    activetransactions: 0,
    pendingDLQ: 0,
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

      // Load transaction data
      const { data: txnData, error: txnError } = await supabase.rpc('get_active_transactions', {
        p_status: null,
        p_limit: 100,
      });

      if (!txnError && txnData) {
        setTransactions(txnData);
      }

      // Load transaction statistics
      const { data: txnStatsData, error: txnStatsError } = await supabase.rpc('get_transaction_statistics', {
        p_days_back: 7,
      });

      if (!txnStatsError && txnStatsData && txnStatsData.length > 0) {
        setTransactionStats(txnStatsData[0]);
      }

      // Load DLQ items
      const { data: dlqData, error: dlqError } = await supabase.rpc('get_dlq_items', {
        p_status: 'pending',
        p_limit: 100,
      });

      if (!dlqError && dlqData) {
        setDlqItems(dlqData);
      }

      // Update state
      setStats({
        totalJourneys: statsData.total_journeys || 0,
        activeAlerts: statsData.active_alerts || 0,
        openIncidents: statsData.open_incidents || 0,
        totalExposure: statsData.total_exposure || 0,
        highRiskJourneys: statsData.high_risk_count || 0,
        transactionSuccessRate: txnStatsData && txnStatsData.length > 0 ? txnStatsData[0].success_rate : 0,
        activetransactions: txnData ? txnData.filter((t: Transaction) => t.status === 'in_progress').length : 0,
        pendingDLQ: dlqData ? dlqData.length : 0,
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
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              title="Transaction Success"
              value={`${stats.transactionSuccessRate.toFixed(1)}%`}
              icon="pulse"
              iconColor="#8B5CF6"
              iconBg="bg-purple-100"
              subtitle="Last 7 days"
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              title="Pending DLQ"
              value={stats.pendingDLQ}
              icon="alert-circle"
              iconColor="#DC2626"
              iconBg="bg-red-100"
              subtitle={stats.pendingDLQ > 0 ? "Needs review" : "All resolved"}
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

  const renderTransactions = () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return '#10b981';
        case 'in_progress': return '#3b82f6';
        case 'failed': return '#ef4444';
        case 'compensating': return '#f97316';
        case 'compensated': return '#eab308';
        case 'partial_failure': return '#b91c1c';
        default: return '#6b7280';
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

    return (
      <View className="flex-1">
        <GradientHeader
          title="Transaction Monitor"
          subtitle="Real-time transactional integrity"
        />

        <View className="px-4 pt-4">
          {/* Transaction Statistics */}
          {transactionStats && (
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 mb-4">
              <Text className="font-bold text-lg text-gray-900 mb-3">Transaction Health (7 days)</Text>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">Success Rate</Text>
                  <Text className="text-2xl font-extrabold text-green-600">
                    {transactionStats.success_rate?.toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-xs text-gray-600 mb-1">Total</Text>
                  <Text className="text-2xl font-extrabold text-gray-900">
                    {transactionStats.total_transactions}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-xs text-gray-600 mb-1">Failed</Text>
                  <Text className="text-2xl font-extrabold text-red-600">
                    {transactionStats.failed_transactions}
                  </Text>
                </View>
              </View>
              {transactionStats.dlq_count > 0 && (
                <View className="bg-red-100 rounded-lg px-3 py-2 mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-700 font-bold ml-2 text-sm">Dead Letter Queue</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveTab('dlq')}
                    className="bg-red-200 px-3 py-1 rounded-full"
                  >
                    <Text className="text-red-800 font-bold text-xs">{transactionStats.dlq_count} items</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          )}

          <SectionHeader
            title="Active Transactions"
            subtitle={`${transactions.length} total`}
          />

          {transactions.length > 0 ? (
            transactions.map((txn, index) => (
              <Card key={txn.transaction_id || `txn-${index}`} className={txn.requires_attention ? 'border-2 border-red-500' : ''}>
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="rounded-full p-2 mr-2"
                        style={{ backgroundColor: getStatusColor(txn.status) + '20' }}
                      >
                        <Ionicons name={getStatusIcon(txn.status) as any} size={16} color={getStatusColor(txn.status)} />
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
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="person" size={14} color="#6b7280" />
                    <Text className="ml-2 text-gray-700 font-semibold text-sm">{txn.customer_name}</Text>
                  </View>
                  {txn.journey_destination && (
                    <View className="flex-row items-center">
                      <Ionicons name="location" size={14} color="#6b7280" />
                      <Text className="ml-2 text-gray-600 text-sm">{txn.journey_destination}</Text>
                    </View>
                  )}
                </View>

                {/* Progress */}
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-700 font-semibold text-xs">Progress</Text>
                    <Text className="text-gray-600 text-xs">
                      {txn.completed_steps}/{txn.total_steps} steps
                    </Text>
                  </View>
                  <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <View
                      className={txn.failed_steps > 0 ? 'bg-red-500' : 'bg-green-500'}
                      style={{
                        width: `${(txn.completed_steps / txn.total_steps) * 100}%`,
                        height: '100%',
                      }}
                    />
                  </View>
                </View>

                {/* Financial */}
                <View className="bg-green-50 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-700 font-semibold text-sm">Transaction Amount</Text>
                    <Text className="text-green-700 font-extrabold text-base">
                      {formatPrice(txn.total_amount)}
                    </Text>
                  </View>
                </View>

                {/* Error Message */}
                {txn.error_message && (
                  <View className="bg-red-50 rounded-xl p-3 mb-3">
                    <View className="flex-row items-start">
                      <Ionicons name="alert-circle" size={14} color="#dc2626" />
                      <Text className="ml-2 text-red-700 text-xs flex-1">{txn.error_message}</Text>
                    </View>
                  </View>
                )}

                {/* Timestamp */}
                <View className="pt-3 border-t border-gray-100">
                  <Text className="text-gray-400 text-xs">
                    Started: {formatDate(txn.started_at)}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              icon="checkmark-done-circle"
              title="No Active Transactions"
              subtitle="All transactions completed successfully"
            />
          )}

          <View className="h-6" />
        </View>
      </View>
    );
  };

  const renderDLQ = () => {
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

        Alert.alert('Success', 'Item escalated to admin team');
        loadDashboardData();
      } catch (error: any) {
        console.error('Error escalating item:', error);
        Alert.alert('Error', 'Failed to escalate item');
      }
    };

    return (
      <View className="flex-1">
        <GradientHeader
          title="Dead Letter Queue"
          subtitle="Failed compensations requiring manual intervention"
        />

        <View className="px-4 pt-4">
          {/* Stats */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 mb-4">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-3xl font-extrabold text-gray-900">{dlqItems.length}</Text>
                <Text className="text-xs text-gray-600">Total Items</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-extrabold text-orange-600">
                  {dlqItems.filter(i => i.escalated).length}
                </Text>
                <Text className="text-xs text-gray-600">Escalated</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-extrabold text-red-600">
                  {dlqItems.filter(i => getAgeInHours(i.created_at) > 24).length}
                </Text>
                <Text className="text-xs text-gray-600">&gt;24h Old</Text>
              </View>
            </View>
          </Card>

          <SectionHeader
            title="Pending Items"
            subtitle={`${dlqItems.length} requiring attention`}
          />

          {dlqItems.length > 0 ? (
            dlqItems.map((item, index) => {
              const ageHours = getAgeInHours(item.created_at);
              const isCritical = ageHours > 24;

              return (
                <Card
                  key={item.dlq_id || `dlq-${index}`}
                  className={isCritical ? 'border-2 border-red-600' : ''}
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-gray-900 mb-1">
                        {item.dlq_id}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {item.transaction_number}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      {item.escalated && (
                        <View className="bg-orange-500 rounded-full px-2 py-1">
                          <Text className="text-white text-xs font-extrabold">ESCALATED</Text>
                        </View>
                      )}
                      {isCritical && (
                        <View className="bg-red-600 rounded-full px-2 py-1">
                          <Text className="text-white text-xs font-extrabold">CRITICAL</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Failed Step */}
                  <View className="bg-red-50 rounded-xl p-3 mb-3">
                    <Text className="text-red-700 font-bold mb-1 text-sm">Failed Step:</Text>
                    <Text className="text-gray-900 font-semibold text-sm">{item.step_name}</Text>
                  </View>

                  {/* Failure Details */}
                  <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <View className="mb-2">
                      <Text className="text-gray-600 text-xs mb-1">Failure Reason</Text>
                      <Text className="text-gray-900 text-sm">{item.failure_reason}</Text>
                    </View>

                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600 text-xs">Attempts Made</Text>
                      <Text className="text-red-600 font-bold text-sm">{item.attempts_made}</Text>
                    </View>

                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600 text-xs">Age</Text>
                      <Text className={`font-bold text-sm ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>
                        {ageHours}h
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600 text-xs">Last Attempt</Text>
                      <Text className="text-gray-700 text-xs">
                        {formatDate(item.last_attempt_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {!item.escalated && (
                    <View className="pt-3 border-t border-gray-100">
                      <ActionButton
                        title="Escalate to Admin"
                        onPress={() => escalateItem(item.dlq_id)}
                        variant="secondary"
                        icon="arrow-up-circle"
                      />
                    </View>
                  )}
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon="checkmark-done-circle"
              title="No Items in DLQ"
              subtitle="All compensations completed successfully"
            />
          )}

          <View className="h-6" />
        </View>
      </View>
    );
  };

  const renderSimulation = () => {
    // Use your machine's IP address instead of localhost for React Native
    // Get this from Metro bundler output or use your machine's local IP
    const API_BASE_URL = 'http://10.243.165.242:8000';

    const runSimulation = async (scenario: string = null) => {
      try {
        setSimulationRunning(true);
        setSimulationProgress(0);
        setCurrentSimulation(null);

        // Call the simulation API
        const response = await fetch(`${API_BASE_URL}/api/v1/transactions/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: 'Demo Customer',
            total_amount: Math.floor(Math.random() * 50000) + 30000,
            scenario: scenario,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setCurrentSimulation(data.simulation);
          setSimulationProgress(100);

          // Reload dashboard data to show new transaction
          loadDashboardData();

          Alert.alert(
            'Simulation Complete',
            `Transaction ${data.simulation.transaction_id} completed with status: ${data.simulation.status}`
          );
        }
      } catch (error: any) {
        console.error('Simulation error:', error);
        Alert.alert('Error', 'Failed to run simulation');
      } finally {
        setSimulationRunning(false);
      }
    };

    const runBatchSimulation = async () => {
      try {
        setSimulationRunning(true);

        const response = await fetch(`${API_BASE_URL}/api/v1/transactions/simulate/batch?count=5`, {
          method: 'POST',
        });

        const data = await response.json();

        if (data.success) {
          Alert.alert(
            'Batch Simulation Complete',
            `Completed ${data.summary.total_transactions} transactions:\n` +
            `✓ Successful: ${data.summary.successful}\n` +
            `✗ Failed: ${data.summary.failed}\n` +
            `🔄 Compensated: ${data.summary.compensated}\n` +
            `⚠️  DLQ Items: ${data.summary.dlq_items}`
          );

          // Reload dashboard data
          loadDashboardData();
        }
      } catch (error: any) {
        console.error('Batch simulation error:', error);
        Alert.alert('Error', 'Failed to run batch simulation');
      } finally {
        setSimulationRunning(false);
      }
    };

    const getEventIcon = (eventType: string) => {
      switch (eventType) {
        case 'transaction_started': return 'play-circle';
        case 'step_completed': return 'checkmark-circle';
        case 'step_failed': return 'close-circle';
        case 'compensation_started': return 'refresh-circle';
        case 'step_compensated': return 'arrow-undo-circle';
        case 'compensation_failed': return 'warning';
        case 'compensation_completed': return 'checkmark-done-circle';
        case 'transaction_completed': return 'checkmark-done';
        default: return 'ellipse';
      }
    };

    const getEventColor = (severity: string) => {
      switch (severity) {
        case 'info': return '#3b82f6';
        case 'warning': return '#f97316';
        case 'error': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return (
      <View className="flex-1">
        <GradientHeader
          title="Transaction Simulation"
          subtitle="Demo rollback engine with realistic scenarios"
        />

        <View className="px-4 pt-4">
          {/* Scenario Buttons */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 mb-4">
            <Text className="text-lg font-extrabold text-gray-900 mb-3">
              🎯 Run Simulation
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Simulate distributed transactions with various outcomes to demonstrate the rollback engine
            </Text>

            <View className="space-y-2">
              <TouchableOpacity
                className="bg-green-500 py-3 px-4 rounded-lg mb-2"
                onPress={() => runSimulation('success')}
                disabled={simulationRunning}
              >
                <Text className="text-white font-bold text-center">✓ Success Scenario</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-orange-500 py-3 px-4 rounded-lg mb-2"
                onPress={() => runSimulation('payment_failure')}
                disabled={simulationRunning}
              >
                <Text className="text-white font-bold text-center">💳 Payment Failure</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-500 py-3 px-4 rounded-lg mb-2"
                onPress={() => runSimulation('hotel_unavailable')}
                disabled={simulationRunning}
              >
                <Text className="text-white font-bold text-center">🏨 Hotel Unavailable</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-500 py-3 px-4 rounded-lg mb-2"
                onPress={() => runSimulation('flight_cancelled')}
                disabled={simulationRunning}
              >
                <Text className="text-white font-bold text-center">✈️ Flight Cancelled</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-purple-600 py-3 px-4 rounded-lg mb-2"
                onPress={runBatchSimulation}
                disabled={simulationRunning}
              >
                <Text className="text-white font-bold text-center">🔥 Batch Simulation (5x)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-700 py-3 px-4 rounded-lg"
                onPress={() => runSimulation(null)}
                disabled={simulationRunning}
              >
                <Text className="text-white font-bold text-center">🎲 Random Scenario</Text>
              </TouchableOpacity>
            </View>

            {simulationRunning && (
              <View className="mt-4">
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="text-center text-sm text-gray-600 mt-2">Running simulation...</Text>
              </View>
            )}
          </Card>

          {/* Current Simulation Results */}
          {currentSimulation && (
            <>
              <SectionHeader
                title="Latest Simulation"
                subtitle={`Transaction ${currentSimulation.transaction_id}`}
              />

              <Card className="mb-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-xl font-extrabold text-gray-900 mb-1">
                      {currentSimulation.transaction_id}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Scenario: {currentSimulation.scenario}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Customer: {currentSimulation.customer_name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Amount: ₹{currentSimulation.total_amount.toLocaleString()}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        currentSimulation.status === 'completed'
                          ? '#10b981'
                          : currentSimulation.status === 'failed'
                          ? '#ef4444'
                          : currentSimulation.status === 'compensated'
                          ? '#eab308'
                          : '#f97316',
                    }}
                  >
                    <Text className="text-white text-xs font-bold uppercase">
                      {currentSimulation.status}
                    </Text>
                  </View>
                </View>

                {/* Progress Bars */}
                <View className="space-y-2 mb-3">
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">
                      Steps Completed: {currentSimulation.steps_completed}/{currentSimulation.total_steps}
                    </Text>
                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-green-500"
                        style={{
                          width: `${(currentSimulation.steps_completed / currentSimulation.total_steps) * 100}%`,
                        }}
                      />
                    </View>
                  </View>

                  {currentSimulation.steps_failed > 0 && (
                    <View>
                      <Text className="text-xs text-gray-600 mb-1">
                        Steps Failed: {currentSimulation.steps_failed}
                      </Text>
                      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-red-500"
                          style={{
                            width: `${(currentSimulation.steps_failed / currentSimulation.total_steps) * 100}%`,
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Error Message */}
                {currentSimulation.error_message && (
                  <View className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                    <Text className="text-xs text-red-500 font-medium mb-1">Error:</Text>
                    <Text className="text-sm text-red-700">{currentSimulation.error_message}</Text>
                    {currentSimulation.error_step && (
                      <Text className="text-xs text-red-600 mt-1">Failed at: {currentSimulation.error_step}</Text>
                    )}
                  </View>
                )}

                {/* Compensation Actions */}
                {currentSimulation.compensation_actions && currentSimulation.compensation_actions.length > 0 && (
                  <View className="bg-orange-50 p-3 rounded-lg mb-3 border border-orange-200">
                    <Text className="text-xs text-orange-600 font-bold mb-2">
                      🔄 Compensation Actions ({currentSimulation.compensation_actions.length})
                    </Text>
                    {currentSimulation.compensation_actions.map((action: any, idx: number) => (
                      <View key={idx} className="flex-row items-center mb-1">
                        <Ionicons
                          name={action.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={action.status === 'completed' ? '#10b981' : '#ef4444'}
                        />
                        <Text className="text-xs text-gray-700 ml-2">
                          Step {action.step_number}: {action.status}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* DLQ Items */}
                {currentSimulation.dlq_items && currentSimulation.dlq_items.length > 0 && (
                  <View className="bg-red-50 p-3 rounded-lg mb-3 border-2 border-red-500">
                    <Text className="text-xs text-red-600 font-bold mb-2">
                      ⚠️ Dead Letter Queue Items ({currentSimulation.dlq_items.length})
                    </Text>
                    {currentSimulation.dlq_items.map((item: any, idx: number) => (
                      <View key={idx} className="bg-white p-2 rounded mb-2 border border-red-200">
                        <Text className="text-xs font-bold text-gray-900">{item.dlq_id}</Text>
                        <Text className="text-xs text-gray-600">Step {item.step_number}</Text>
                        <Text className="text-xs text-red-700 mt-1">{item.failure_reason}</Text>
                        <Text className="text-xs text-gray-500 mt-1">Attempts: {item.attempts_made}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>

              {/* Event Timeline */}
              {currentSimulation.events && currentSimulation.events.length > 0 && (
                <>
                  <SectionHeader
                    title="Event Timeline"
                    subtitle={`${currentSimulation.events.length} events`}
                  />

                  {currentSimulation.events.map((event: any, index: number) => (
                    <View key={index} className="mb-2">
                      <View className="flex-row items-start">
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: getEventColor(event.severity) + '20' }}
                        >
                          <Ionicons
                            name={getEventIcon(event.event) as any}
                            size={18}
                            color={getEventColor(event.severity)}
                          />
                        </View>
                        <View className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
                          <Text className="text-sm font-bold text-gray-900 mb-1">
                            {event.message}
                          </Text>
                          {event.step && (
                            <Text className="text-xs text-gray-600">Step: {event.step}</Text>
                          )}
                          {event.duration_ms && (
                            <Text className="text-xs text-gray-500">Duration: {event.duration_ms}ms</Text>
                          )}
                          <Text className="text-xs text-gray-400 mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
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
              { key: 'transactions', label: 'Transactions', icon: 'pulse' },
              { key: 'dlq', label: 'DLQ', icon: 'alert-circle' },
              { key: 'simulation', label: 'Simulation', icon: 'play-circle' },
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
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'dlq' && renderDLQ()}
        {activeTab === 'simulation' && renderSimulation()}
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

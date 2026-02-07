import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
<<<<<<< HEAD
  RefreshControl,
=======
  Animated,
>>>>>>> 5d4be93f63d8c626f810221aa30b82b978ee7a0d
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { StatCard, StatusBadge, SectionHeader, EmptyState, GradientHeader } from "../../component/UIKit";

interface JourneySummary {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
}

interface RecentJourney {
  id: string;
  customer_name: string;
  status: string;
  total_cost: number;
  created_at: string;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [refreshing, setRefreshing] = useState(false);
  const [journeySummary, setJourneySummary] = useState<JourneySummary>({
    total: 0,
    pending: 0,
    confirmed: 0,
    failed: 0,
  });
  const [recentJourneys, setRecentJourneys] = useState<RecentJourney[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
=======
  const fadeAnim = useState(new Animated.Value(0))[0];
>>>>>>> 5d4be93f63d8c626f810221aa30b82b978ee7a0d

  useEffect(() => {
<<<<<<< tejas/operation
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/onboarding");
      } else {
        setUser(data.session.user);
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
      setLoading(false);
    });
=======
    checkAuth();
    loadDashboardData();
>>>>>>> local
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/sign-in");
    } else {
      setUser(data.session.user);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Load journey statistics
      const { data: journeys, error: journeysError } = await supabase
        .from('journeys')
        .select('*')
        .eq('created_by', user.id);

      if (!journeysError && journeys) {
        setJourneySummary({
          total: journeys.length,
          pending: journeys.filter(j => j.status === 'PENDING').length,
          confirmed: journeys.filter(j => j.status === 'CONFIRMED').length,
          failed: journeys.filter(j => j.status === 'FAILED' || j.status === 'ON_HOLD').length,
        });

        // Calculate today's revenue
        const today = new Date().toISOString().split('T')[0];
        const todayJourneys = journeys.filter(j => 
          j.created_at.startsWith(today) && j.status === 'CONFIRMED'
        );
        const revenue = todayJourneys.reduce((sum, j) => sum + (j.total_cost || 0), 0);
        setTodayRevenue(revenue);

        // Get recent journeys
        const recent = journeys
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentJourneys(recent);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert(error.message);
    } else {
      router.replace("/onboarding");
    }
  };

  if (loading) return null;
<<<<<<< HEAD
  if (!user) return <Redirect href="/sign-in" />;
<<<<<<< tejas/operation
=======

  const successRate = journeySummary.total > 0 
    ? Math.round((journeySummary.confirmed / journeySummary.total) * 100) 
    : 0;
>>>>>>> local

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <GradientHeader
          title="TravelOps"
          subtitle={`Welcome back, ${user?.user_metadata?.full_name || 'Agent'}`}
          colors={['#3b82f6', '#1d4ed8']}
          icon="airplane"
        />

        {/* Quick Actions */}
        <View className="px-4 pt-6 pb-3">
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => router.push('/(agent)/create')}
              className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-lg"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white text-lg font-bold mb-1">New Journey</Text>
                  <Text className="text-blue-100 text-xs">Create multi-city trip</Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                  <Ionicons name="add-circle-outline" size={28} color="white" />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(agent)/journeys')}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 text-lg font-bold mb-1">My Journeys</Text>
                  <Text className="text-gray-500 text-xs">{journeySummary.total} active</Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
                  <Ionicons name="list-outline" size={24} color="#3b82f6" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View className="px-4 pb-3">
          <SectionHeader title="Today's Performance" subtitle="Real-time metrics" />
          <View className="flex-row flex-wrap -mx-1.5">
            <View className="w-1/2 px-1.5 mb-3">
              <StatCard
                title="Total Journeys"
                value={journeySummary.total}
                icon="briefcase-outline"
                iconColor="#3b82f6"
                iconBg="bg-blue-100"
              />
            </View>
            <View className="w-1/2 px-1.5 mb-3">
              <StatCard
                title="Confirmed"
                value={journeySummary.confirmed}
                icon="checkmark-circle-outline"
                iconColor="#10b981"
                iconBg="bg-green-100"
              />
            </View>
            <View className="w-1/2 px-1.5 mb-3">
              <StatCard
                title="In Progress"
                value={journeySummary.pending}
                icon="time-outline"
                iconColor="#f59e0b"
                iconBg="bg-amber-100"
              />
            </View>
            <View className="w-1/2 px-1.5 mb-3">
              <StatCard
                title="Success Rate"
                value={`${successRate}%`}
                icon="trending-up-outline"
                iconColor="#8b5cf6"
                iconBg="bg-purple-100"
=======
  if (!user) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= TOP BAR ================= */}
      <View className="bg-white shadow-sm">
        <LinearGradient
          colors={["#ffffff", "#f8fafc"]}
          className="flex-row items-center px-5 py-4 justify-between"
        >
          {/* Avatar with gradient border */}
          <View className="relative">
            <View className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg">
              <View className="w-11 h-11 rounded-full bg-blue-600 items-center justify-center">
                <Text className="font-bold text-white text-lg">
                  {user.user_metadata?.full_name?.[0] ?? "A"}
                </Text>
              </View>
            </View>
            <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </View>

          {/* Title */}
          <View className="flex-1 px-4">
            <Text className="text-slate-900 text-xl font-bold">
              Dashboard
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Welcome back, {user.user_metadata?.full_name?.split(' ')[0] ?? 'Agent'}
            </Text>
          </View>

          {/* Logout with background */}
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <MaterialIcons name="logout" size={20} color="#475569" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* ================= BODY ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ===== QUICK ACTIONS ===== */}
          <View className="px-5 py-4">
            <Text className="text-base font-bold text-gray-800 mb-4">
              Quick Actions
            </Text>

            <View className="flex-row gap-3">
              <ActionCard
                title="New Journey"
                subtitle="Create"
                icon="add-circle"
                onPress={() => router.push("/(agent)/Create/create")}
                primary
              />
              <ActionCard
                title="My Journeys"
                subtitle="View All"
                icon="map"
                onPress={() => router.push("/(agent)/journeys")}
>>>>>>> 5d4be93f63d8c626f810221aa30b82b978ee7a0d
              />
            </View>
          </View>

<<<<<<< HEAD
        {/* Revenue Card */}
        <View className="px-4 pb-3">
          <LinearGradient
            colors={['#10b981', '#059669']}
            className="rounded-2xl p-5 shadow-lg"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-emerald-100 text-sm mb-1">Today's Revenue</Text>
                <Text className="text-white text-3xl font-bold">₹{todayRevenue.toLocaleString('en-IN')}</Text>
              </View>
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="cash-outline" size={28} color="white" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Journeys */}
        <View className="px-4 pb-6">
          <SectionHeader 
            title="Recent Journeys" 
            subtitle={`${recentJourneys.length} recent trips`}
            action={{ label: 'View All', onPress: () => router.push('/(agent)/journeys') }}
          />
          
          {recentJourneys.length === 0 ? (
            <EmptyState
              icon="airplane-outline"
              title="No journeys yet"
              subtitle="Start by creating your first multi-city journey"
              action={{ label: 'Create Journey', onPress: () => router.push('/(agent)/create') }}
            />
          ) : (
            <View className="space-y-3">
              {recentJourneys.map((journey) => (
                <TouchableOpacity
                  key={journey.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(agent)/journeys`)}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-bold text-gray-900 mb-1">
                        {journey.customer_name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {new Date(journey.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <StatusBadge status={journey.status} size="sm" />
                  </View>
                  
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Ionicons name="cash-outline" size={18} color="#6b7280" />
                      <Text className="ml-2 text-base font-semibold text-gray-900">
                        ₹{journey.total_cost.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Help Section */}
        <View className="px-4 pb-8">
          <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="bulb-outline" size={22} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-blue-900 mb-1">Pro Tip</Text>
                <Text className="text-sm text-blue-700 leading-5">
                  Use the journey creation wizard to plan multi-city trips with automatic supplier selection and risk management.
                </Text>
              </View>
            </View>
          </View>
        </View>
=======
          {/* ===== STATS ===== */}
          <View className="px-5 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-800">
                Today's Overview
              </Text>
              <Text className="text-xs text-gray-500">Last 24 hours</Text>
            </View>

            <View className="flex-row gap-3">
              <StatCard label="Active" value="4" icon="time-outline" color="blue" />
              <StatCard label="Escalated" value="1" icon="warning-outline" color="red" />
              <StatCard label="Done" value="12" icon="checkmark-circle-outline" color="green" />
            </View>
          </View>

          {/* ===== RECENT JOURNEYS ===== */}
          <View className="px-5 py-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-800">
                Recent Activity
              </Text>
              <TouchableOpacity onPress={() => router.push("/(agent)/journeys")}>
                <Text className="text-sm text-blue-600 font-semibold">See All</Text>
              </TouchableOpacity>
            </View>

            <JourneyRow
              title="Mumbai → Dubai"
              subtitle="Emirates Flight EK 501"
              status="Confirmed"
              time="2 hours ago"
              success
            />
            <JourneyRow
              title="Delhi → Paris"
              subtitle="Air France AF 226"
              status="Escalated"
              time="4 hours ago"
            />
            <JourneyRow
              title="Bangalore → Singapore"
              subtitle="Singapore Airlines SQ 508"
              status="In Progress"
              time="6 hours ago"
              inProgress
            />
          </View>
        </Animated.View>
>>>>>>> 5d4be93f63d8c626f810221aa30b82b978ee7a0d
      </ScrollView>
    </SafeAreaView>
  );
}
<<<<<<< HEAD
=======

/* ================= COMPONENTS ================= */

function ActionCard({
  title,
  subtitle,
  icon,
  onPress,
  primary,
}: {
  title: string;
  subtitle: string;
  icon: any;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1"
      activeOpacity={0.7}
    >
      {primary ? (
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          className="rounded-2xl p-5 shadow-lg"
        >
          <View className="bg-white/20 rounded-xl p-2 self-start mb-3">
            <Ionicons name={icon} size={28} color="white" />
          </View>
          <Text className="text-white/80 text-xs font-semibold mb-1">
            {subtitle}
          </Text>
          <Text className="text-white font-bold text-base">{title}</Text>
        </LinearGradient>
      ) : (
        <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <View className="bg-blue-50 rounded-xl p-2 self-start mb-3">
            <Ionicons name={icon} size={28} color="#2563eb" />
          </View>
          <Text className="text-gray-500 text-xs font-semibold mb-1">
            {subtitle}
          </Text>
          <Text className="text-gray-900 font-bold text-base">{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: "blue" | "red" | "green";
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      iconBg: "bg-red-100",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      iconBg: "bg-green-100",
    },
  };

  const colors = colorMap[color];

  return (
    <View className={`flex-1 ${colors.bg} rounded-2xl p-4 border border-${color}-100`}>
      <View className={`${colors.iconBg} rounded-lg p-1.5 self-start mb-2`}>
        <Ionicons name={icon} size={16} color={colors.text.replace('text-', '#')} />
      </View>
      <Text className={`text-3xl font-extrabold ${colors.text} mb-1`}>
        {value}
      </Text>
      <Text className="text-xs text-gray-600 font-medium">{label}</Text>
    </View>
  );
}

function JourneyRow({
  title,
  subtitle,
  status,
  time,
  success,
  inProgress,
}: {
  title: string;
  subtitle: string;
  status: string;
  time: string;
  success?: boolean;
  inProgress?: boolean;
}) {
  const statusColor = success
    ? "text-green-600 bg-green-50"
    : inProgress
    ? "text-amber-600 bg-amber-50"
    : "text-red-600 bg-red-50";

  const iconColor = success ? "#16a34a" : inProgress ? "#d97706" : "#dc2626";
  const iconName = success
    ? "checkmark-circle"
    : inProgress
    ? "time"
    : "alert-circle";

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 border border-gray-200 mb-3 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-base mb-1">
            {title}
          </Text>
          <Text className="text-xs text-gray-500">{subtitle}</Text>
        </View>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <View className={`px-3 py-1.5 rounded-lg ${statusColor}`}>
          <Text className={`text-xs font-bold ${statusColor.split(' ')[0]}`}>
            {status}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">{time}</Text>
      </View>
    </TouchableOpacity>
  );
}
>>>>>>> 5d4be93f63d8c626f810221aa30b82b978ee7a0d

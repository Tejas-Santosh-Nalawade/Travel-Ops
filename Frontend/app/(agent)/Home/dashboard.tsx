import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

export default function AgentDashboard() {
  const router = useRouter();
  const { fullName } = useAuth();
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [stats, setStats] = useState({
    active: 0,
    escalated: 0,
    completed: 0,
  });
  const [recentJourneys, setRecentJourneys] = useState<any[]>([]);


  // Load dashboard data
  const loadDashboardData = async (userId: string) => {
    try {
      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: journeysData, error: journeysError } = await supabase
        .from('journeys')
        .select('id, customer_name, status, total_cost, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (journeysError) throw journeysError;

      // Calculate stats
      const active = journeysData?.filter(j => j.status === 'PENDING' || j.status === 'DRAFT').length || 0;
      const escalated = journeysData?.filter(j => j.status === 'FAILED' || j.status === 'ON_HOLD').length || 0;
      const completed = journeysData?.filter(j => j.status === 'CONFIRMED').length || 0;

      setStats({ active, escalated, completed });

      // Get recent journeys (last 24 hours)
      const { data: recentData, error: recentError } = await supabase
        .from('journeys')
        .select('id, customer_name, status, total_cost, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentError) throw recentError;
      setRecentJourneys(recentData || []);

    } catch (error: any) {
      console.error('Error loading dashboard data:', error.message);
    }
  };

  useEffect(() => {
    // Simply initialize the UI without auth
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Set loading to false to show the dashboard
    setLoading(false);
  }, []);

  // ✅ Logout
  const handleLogout = () => {
    router.replace("/(auth)/onboarding");
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Don't render until data is loaded
  if (loading) return null;


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
                  {fullName.charAt(0).toUpperCase()}
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
              Welcome back, {fullName}
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

            {/* Action Buttons Grid */}
            <View className="flex-row flex-wrap -mx-2">
              {/* Create Journey */}
              <View className="w-1/2 px-2 mb-3">
                <TouchableOpacity
                  onPress={() => router.push("/Create/create")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#3b82f6", "#2563eb"]}
                    className="rounded-2xl p-4 shadow-lg"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View className="w-12 h-12 rounded-full bg-white/30 items-center justify-center mb-2">
                      <Ionicons name="add-circle" size={28} color="#ffffff" />
                    </View>
                    <Text className="text-white font-bold text-base">
                      New Journey
                    </Text>
                    <Text className="text-blue-100 text-xs mt-1">
                      Create booking
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Budget Packages */}
              <View className="w-1/2 px-2 mb-3">
                <TouchableOpacity
                  onPress={() => router.push("/(agent)/Home/budget-packages")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#a855f7", "#9333ea"]}
                    className="rounded-2xl p-4 shadow-lg"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View className="w-12 h-12 rounded-full bg-white/30 items-center justify-center mb-2">
                      <Ionicons name="wallet-outline" size={28} color="#ffffff" />
                    </View>
                    <Text className="text-white font-bold text-base">
                      Budget
                    </Text>
                    <Text className="text-purple-100 text-xs mt-1">
                      By budget
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Credit Card Recommendations - AI Powered */}
              <View className="w-1/2 px-2 mb-3">
                <TouchableOpacity
                  onPress={() => router.push("/(agent)/Home/credit-recommendations")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    className="rounded-2xl p-4 shadow-lg"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View className="w-12 h-12 rounded-full bg-white/30 items-center justify-center mb-2">
                      <Ionicons name="card" size={28} color="#ffffff" />
                    </View>
                    <Text className="text-white font-bold text-base">
                      Credit Cards
                    </Text>
                    <Text className="text-green-100 text-xs mt-1">
                      AI rewards
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* AI Orchestrator */}
              <View className="w-1/2 px-2 mb-3">
                <TouchableOpacity
                  onPress={() => router.push("/(agent)/Home/ai-recommendations")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#ec4899", "#db2777"]}
                    className="rounded-2xl p-4 shadow-lg"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View className="w-12 h-12 rounded-full bg-white/30 items-center justify-center mb-2">
                      <Ionicons name="sparkles" size={28} color="#ffffff" />
                    </View>
                    <Text className="text-white font-bold text-base">
                      AI Planner
                    </Text>
                    <Text className="text-pink-100 text-xs mt-1">
                      Custom trips
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* View Journeys */}
              <View className="w-1/2 px-2 mb-3">
                <TouchableOpacity
                  onPress={() => router.push("/(agent)/Journey/journeys")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#22c55e", "#16a34a"]}
                    className="rounded-2xl p-4 shadow-lg"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View className="w-12 h-12 rounded-full bg-white/30 items-center justify-center mb-2">
                      <Ionicons name="list" size={28} color="#ffffff" />
                    </View>
                    <Text className="text-white font-bold text-base">
                      Journeys
                    </Text>
                    <Text className="text-green-100 text-xs mt-1">
                      View all
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ===== STATS ===== */}
          <View className="px-5 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-800">
                Today's Overview
              </Text>
              <Text className="text-xs text-gray-500">Last 24 hours</Text>
            </View>

            <View className="flex-row gap-3">
              <StatCard label="Active" value={stats.active.toString()} icon="time-outline" color="blue" />
              <StatCard label="Escalated" value={stats.escalated.toString()} icon="warning-outline" color="red" />
              <StatCard label="Done" value={stats.completed.toString()} icon="checkmark-circle-outline" color="green" />
            </View>
          </View>

          {/* ===== RECENT JOURNEYS ===== */}
          <View className="px-5 py-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-800">
                Recent Activity
              </Text>
              <TouchableOpacity onPress={() => router.push("/Journey/journeys")}>
                <Text className="text-sm text-blue-600 font-semibold">See All</Text>
              </TouchableOpacity>
            </View>

            {recentJourneys.length > 0 ? (
              recentJourneys.map((journey) => (
                <JourneyRow
                  key={journey.id}
                  title={journey.customer_name}
                  subtitle={`Journey #${journey.id.slice(0, 8)}`}
                  status={journey.status}
                  time={getTimeAgo(journey.created_at)}
                  success={journey.status === 'CONFIRMED'}
                  inProgress={journey.status === 'PENDING' || journey.status === 'DRAFT'}
                />
              ))
            ) : (
              <View className="bg-white rounded-2xl p-6 border border-gray-200">
                <Text className="text-gray-500 text-center">No recent journeys</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
          className="rounded-xl p-5 shadow-lg"
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
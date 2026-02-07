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
import { supabase } from "../../lib/supabase";

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // ✅ Session check
  useEffect(() => {
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
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert(error.message);
    } else {
      router.replace("/onboarding");
    }
  };

  if (loading) return null;
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
              />
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
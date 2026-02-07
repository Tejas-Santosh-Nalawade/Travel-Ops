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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/sign-in");
      } else {
        setUser(data.session.user);
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
      router.replace("/sign-in");
    }
  };

  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= TOP BAR ================= */}
      <View className="flex-row items-center p-4 pb-3 justify-between border-b border-gray-200 bg-white">
        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
          <Text className="font-bold text-white">
            {user.user_metadata?.full_name?.[0] ?? "A"}
          </Text>
        </View>

        {/* Title */}
        <View className="flex-1 px-3">
          <Text className="text-slate-900 text-lg font-bold">
            Agent Dashboard
          </Text>
          <Text className="text-xs text-gray-500">
            {user.user_metadata?.full_name}
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* ================= BODY ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ===== HERO / STATUS CARD ===== */}
        <View className="p-4">
          <View className="rounded-xl overflow-hidden border border-blue-100 bg-white shadow-sm">
            <LinearGradient
              colors={["#dbeafe", "#bfdbfe"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-24 p-4"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="briefcase-outline" size={18} color="#1e40af" />
                <Text className="text-blue-900 text-xs font-bold uppercase">
                  Journey Overview
                </Text>
              </View>
            </LinearGradient>

            <View className="p-4">
              <Text className="text-slate-900 text-xl font-bold">
                You have 1 escalated journey
              </Text>
              <Text className="text-gray-600 mt-1">
                Immediate attention required
              </Text>

              <TouchableOpacity
                className="bg-blue-600 mt-4 px-4 py-2 rounded-lg self-start"
                onPress={() => router.push("/(agent)/journeys")}
              >
                <Text className="text-white font-semibold">
                  View Journeys
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== QUICK ACTIONS ===== */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-3">
            Quick Actions
          </Text>

          <View className="flex-row gap-4">
            <ActionCard
              title="Create Journey"
              icon="add-circle-outline"
              onPress={() => router.push("/(agent)/create")}
              primary
            />
            <ActionCard
              title="My Journeys"
              icon="map-outline"
              onPress={() => router.push("/(agent)/journeys")}
            />
          </View>
        </View>

        {/* ===== STATS ===== */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-3">
            Today’s Snapshot
          </Text>

          <View className="flex-row gap-4">
            <StatCard label="Active" value="4" />
            <StatCard label="Escalated" value="1" danger />
            <StatCard label="Completed" value="12" />
          </View>
        </View>

        {/* ===== RECENT JOURNEYS ===== */}
        <View className="px-4 pb-8">
          <Text className="text-sm font-bold text-gray-700 mb-3">
            Recent Journeys
          </Text>

          <JourneyRow title="Mumbai → Dubai" status="Confirmed" success />
          <JourneyRow title="Delhi → Paris" status="Escalated" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function ActionCard({
  title,
  icon,
  onPress,
  primary,
}: {
  title: string;
  icon: any;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 rounded-xl p-4 ${
        primary ? "bg-blue-600" : "bg-white border border-gray-200"
      }`}
    >
      <Ionicons
        name={icon}
        size={26}
        color={primary ? "white" : "#2563eb"}
      />
      <Text
        className={`mt-2 font-bold ${
          primary ? "text-white" : "text-gray-900"
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text
        className={`text-2xl font-extrabold ${
          danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function JourneyRow({
  title,
  status,
  success,
}: {
  title: string;
  status: string;
  success?: boolean;
}) {
  return (
    <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
      <Text className="font-bold text-gray-900">{title}</Text>
      <Text
        className={`text-sm mt-1 ${
          success ? "text-green-600" : "text-red-600"
        }`}
      >
        {status}
      </Text>
    </View>
  );
}
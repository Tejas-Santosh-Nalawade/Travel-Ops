import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type JourneyStatus = "success" | "in-progress" | "pending" | "failed";

interface JourneyItem {
  id: string;
  category: string;
  title: string;
  price: number;
  icon: string;
  iconBg: string;
  status: JourneyStatus;
  statusText: string;
  completedTime?: string;
}

export default function JourneyDetails() {
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const journeyItems: JourneyItem[] = [
    {
      id: "1",
      category: "Flight Booking",
      title: "Air India",
      price: 12400,
      icon: "airplane",
      iconBg: "#dbeafe",
      status: "success",
      statusText: "Completed 14:20",
      completedTime: "14:20",
    },
    {
      id: "2",
      category: "Ground Transfer",
      title: "Uber for Business",
      price: 1200,
      icon: "car",
      iconBg: "#dbeafe",
      status: "in-progress",
      statusText: "Orchestrating...",
    },
    {
      id: "3",
      category: "Hotel Reservation",
      title: "Taj Hotels",
      price: 32000,
      icon: "bed",
      iconBg: "#e5e7eb",
      status: "pending",
      statusText: "Waiting...",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between px-5 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 text-center">
              JRN-1098
            </Text>
          </View>

          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Breadcrumb */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-blue-600">
              JOURNEYS
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#9ca3af"
              className="mx-1"
            />
            <Text className="text-sm font-semibold text-gray-400">ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* ================= TIMELINE CONTENT ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
          {/* Timeline */}
          <View className="relative">
            {/* Vertical Line */}
            <View className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {journeyItems.map((item, index) => (
              <View key={item.id} className="relative mb-6">
                {/* Status Badge & Time */}
                <View className="flex-row items-center justify-between mb-3">
                  <StatusBadge status={item.status} />
                  <Text
                    className={`text-sm font-medium ${
                      item.status === "success"
                        ? "text-gray-600"
                        : item.status === "in-progress"
                          ? "text-amber-600 italic"
                          : "text-gray-400 italic"
                    }`}
                  >
                    {item.statusText}
                  </Text>
                </View>

                {/* Journey Card */}
                <View className="ml-16">
                  <JourneyCard item={item} />
                </View>
              </View>
            ))}
          </View>

          {/* Completed */}
          <View className="mt-4 flex-row items-center justify-between rounded-xl bg-green-50 px-4 py-3 border border-green-200">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center">
                <Ionicons name="checkmark-done" size={18} color="#10b981" />
              </View>

              <View>
                <Text className="text-sm font-semibold text-green-800">
                  All steps completed
                </Text>
                <Text className="text-xs text-green-600">
                  Journey is ready to review
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(agent)/journeys")}
              activeOpacity={0.7}
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm font-semibold text-green-700">View</Text>
              <Ionicons name="chevron-forward" size={16} color="#047857" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function StatusBadge({ status }: { status: JourneyStatus }) {
  const configs = {
    success: {
      bg: "bg-green-500",
      border: "border-green-200",
      icon: "checkmark",
      iconColor: "#ffffff",
      label: "SUCCESS",
      labelBg: "bg-green-50",
      labelText: "text-green-700",
    },
    "in-progress": {
      bg: "bg-amber-500",
      border: "border-amber-200",
      icon: "time",
      iconColor: "#ffffff",
      label: "IN-PROGRESS",
      labelBg: "bg-amber-50",
      labelText: "text-amber-700",
    },
    pending: {
      bg: "bg-gray-400",
      border: "border-gray-200",
      icon: "pause",
      iconColor: "#ffffff",
      label: "PENDING",
      labelBg: "bg-gray-50",
      labelText: "text-gray-600",
    },
    failed: {
      bg: "bg-red-500",
      border: "border-red-200",
      icon: "close",
      iconColor: "#ffffff",
      label: "FAILED",
      labelBg: "bg-red-50",
      labelText: "text-red-700",
    },
  };

  const config = configs[status];

  return (
    <View className="flex-row items-center gap-2">
      {/* Status Circle Icon */}
      <View
        className={`w-12 h-12 rounded-full ${config.bg} items-center justify-center shadow-lg z-10 border-4 border-white`}
      >
        <Ionicons
          name={config.icon as any}
          size={20}
          color={config.iconColor}
        />
      </View>

      {/* Status Label */}
      <View className={`${config.labelBg} px-3 py-1.5 rounded-lg`}>
        <Text className={`text-xs font-bold ${config.labelText}`}>
          {config.label}
        </Text>
      </View>
    </View>
  );
}

function JourneyCard({ item }: { item: JourneyItem }) {
  const statusColors = {
    success: "border-green-200 bg-green-50/30",
    "in-progress": "border-blue-200 bg-blue-50/30",
    pending: "border-gray-200 bg-white",
    failed: "border-red-200 bg-red-50/30",
  };

  return (
    <View
      className={`rounded-2xl border-2 ${statusColors[item.status]} p-5 shadow-sm`}
    >
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">{item.category}</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {item.title}
          </Text>
          <Text className="text-2xl font-bold text-blue-600">
            ₹{item.price.toLocaleString("en-IN")}
          </Text>
        </View>

        {/* Icon */}
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: item.iconBg }}
        >
          <Ionicons name={item.icon as any} size={28} color="#6b7280" />
        </View>
      </View>

      {/* View Logs Button */}
      <TouchableOpacity className="flex-row items-center gap-2 self-start">
        <View className="bg-blue-600 rounded-lg p-1.5">
          <MaterialIcons name="receipt-long" size={14} color="#ffffff" />
        </View>
        <Text className="text-blue-600 font-bold text-base">View Logs</Text>
      </TouchableOpacity>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity className="items-center py-2 px-3">
      {active ? (
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          className="w-10 h-10 rounded-xl items-center justify-center mb-1"
        >
          <Ionicons name={icon as any} size={22} color="#ffffff" />
        </LinearGradient>
      ) : (
        <View className="w-10 h-10 items-center justify-center mb-1">
          <Ionicons name={icon as any} size={22} color="#9ca3af" />
        </View>
      )}
      <Text
        className={`text-xs font-semibold ${
          active ? "text-blue-600" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

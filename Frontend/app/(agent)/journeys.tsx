import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type JourneyStatus = "active" | "completed" | "escalated" | "cancelled";
type FilterType = "all" | "active" | "completed" | "escalated";

interface Journey {
  id: string;
  journeyCode: string;
  route: string;
  travelerName: string;
  travelers: number;
  departureDate: string;
  status: JourneyStatus;
  services: number;
  completedServices: number;
  amount: number;
  lastUpdated: string;
}

export default function JourneysList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const journeys: Journey[] = [
    {
      id: "1",
      journeyCode: "JRN-1098",
      route: "Mumbai → Dubai",
      travelerName: "Rahul Sharma",
      travelers: 2,
      departureDate: "Aug 14, 2024",
      status: "escalated",
      services: 3,
      completedServices: 1,
      amount: 45600,
      lastUpdated: "2 hours ago",
    },
    {
      id: "2",
      journeyCode: "JRN-1097",
      route: "Delhi → Paris",
      travelerName: "Priya Patel",
      travelers: 1,
      departureDate: "Aug 16, 2024",
      status: "active",
      services: 4,
      completedServices: 2,
      amount: 82000,
      lastUpdated: "5 hours ago",
    },
    {
      id: "3",
      journeyCode: "JRN-1096",
      route: "Bangalore → Singapore",
      travelerName: "Amit Kumar",
      travelers: 3,
      departureDate: "Aug 10, 2024",
      status: "completed",
      services: 5,
      completedServices: 5,
      amount: 125000,
      lastUpdated: "1 day ago",
    },
    {
      id: "4",
      journeyCode: "JRN-1095",
      route: "Chennai → London",
      travelerName: "Sneha Reddy",
      travelers: 2,
      departureDate: "Aug 18, 2024",
      status: "active",
      services: 3,
      completedServices: 1,
      amount: 95000,
      lastUpdated: "3 hours ago",
    },
    {
      id: "5",
      journeyCode: "JRN-1094",
      route: "Hyderabad → New York",
      travelerName: "Vikram Singh",
      travelers: 1,
      departureDate: "Aug 12, 2024",
      status: "completed",
      services: 6,
      completedServices: 6,
      amount: 150000,
      lastUpdated: "3 days ago",
    },
    {
      id: "6",
      journeyCode: "JRN-1093",
      route: "Pune → Bangkok",
      travelerName: "Anjali Mehta",
      travelers: 4,
      departureDate: "Aug 20, 2024",
      status: "active",
      services: 3,
      completedServices: 0,
      amount: 68000,
      lastUpdated: "1 hour ago",
    },
  ];

  const filteredJourneys = journeys.filter((journey) => {
    const matchesSearch =
      journey.journeyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.travelerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" || journey.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    all: journeys.length,
    active: journeys.filter((j) => j.status === "active").length,
    completed: journeys.filter((j) => j.status === "completed").length,
    escalated: journeys.filter((j) => j.status === "escalated").length,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="bg-white shadow-sm">
        <LinearGradient
          colors={["#ffffff", "#f8fafc"]}
          className="px-5 pt-4 pb-3"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                All Journeys
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {filteredJourneys.length} journey{filteredJourneys.length !== 1 ? "s" : ""} found
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(agent)/Create/create")}
              className="overflow-hidden rounded-xl shadow-md"
            >
              <LinearGradient
                colors={["#3b82f6", "#2563eb"]}
                className="px-4 py-3 flex-row items-center gap-2"
              >
                <Ionicons name="add-circle" size={20} color="#ffffff" />
                <Text className="text-white font-bold">New</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-200">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              placeholder="Search by code, route, or traveler..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-base text-gray-900"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 py-3 border-t border-gray-100"
        >
          <View className="flex-row gap-2">
            <FilterTab
              label="All"
              count={stats.all}
              active={activeFilter === "all"}
              onPress={() => setActiveFilter("all")}
            />
            <FilterTab
              label="Active"
              count={stats.active}
              active={activeFilter === "active"}
              onPress={() => setActiveFilter("active")}
              color="blue"
            />
            <FilterTab
              label="Completed"
              count={stats.completed}
              active={activeFilter === "completed"}
              onPress={() => setActiveFilter("completed")}
              color="green"
            />
            <FilterTab
              label="Escalated"
              count={stats.escalated}
              active={activeFilter === "escalated"}
              onPress={() => setActiveFilter("escalated")}
              color="red"
            />
          </View>
        </ScrollView>
      </View>

      {/* ================= JOURNEYS LIST ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-4">
          {filteredJourneys.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="search" size={40} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 text-base font-semibold">
                No journeys found
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            filteredJourneys.map((journey) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                onPress={() => router.push(`/(agent)/journey/`)}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function FilterTab({
  label,
  count,
  active,
  onPress,
  color = "gray",
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  color?: "gray" | "blue" | "green" | "red";
}) {
  const colorConfig = {
    gray: {
      bg: "bg-gray-600",
      activeBg: "bg-gray-100",
      activeText: "text-gray-900",
      badge: "bg-gray-200",
      badgeText: "text-gray-700",
    },
    blue: {
      bg: "bg-blue-600",
      activeBg: "bg-blue-50",
      activeText: "text-blue-600",
      badge: "bg-blue-100",
      badgeText: "text-blue-600",
    },
    green: {
      bg: "bg-green-600",
      activeBg: "bg-green-50",
      activeText: "text-green-600",
      badge: "bg-green-100",
      badgeText: "text-green-600",
    },
    red: {
      bg: "bg-red-600",
      activeBg: "bg-red-50",
      activeText: "text-red-600",
      badge: "bg-red-100",
      badgeText: "text-red-600",
    },
  };

  const config = colorConfig[color];

  return (
    <TouchableOpacity onPress={onPress}>
      {active ? (
        <View className={`${config.activeBg} rounded-xl px-4 py-2 flex-row items-center gap-2`}>
          <Text className={`font-bold ${config.activeText}`}>{label}</Text>
          <View className={`${config.badge} rounded-lg px-2 py-0.5`}>
            <Text className={`text-xs font-bold ${config.badgeText}`}>
              {count}
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex-row items-center gap-2">
          <Text className="font-semibold text-gray-600">{label}</Text>
          <View className="bg-gray-100 rounded-lg px-2 py-0.5">
            <Text className="text-xs font-bold text-gray-600">{count}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function JourneyCard({
  journey,
  onPress,
}: {
  journey: Journey;
  onPress: () => void;
}) {
  const statusConfig = {
    active: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-600",
      badgeText: "text-white",
      label: "Active",
      icon: "time",
      progressBg: "bg-blue-100",
      progressFill: "bg-blue-600",
    },
    completed: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-600",
      badgeText: "text-white",
      label: "Completed",
      icon: "checkmark-circle",
      progressBg: "bg-green-100",
      progressFill: "bg-green-600",
    },
    escalated: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-600",
      badgeText: "text-white",
      label: "Escalated",
      icon: "warning",
      progressBg: "bg-red-100",
      progressFill: "bg-red-600",
    },
    cancelled: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-600",
      badgeText: "text-white",
      label: "Cancelled",
      icon: "close-circle",
      progressBg: "bg-gray-100",
      progressFill: "bg-gray-600",
    },
  };

  const config = statusConfig[journey.status];
  const progress = (journey.completedServices / journey.services) * 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-4"
    >
      <View
        className={`rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden shadow-sm`}
      >
        {/* Card Header */}
        <View className="bg-white/60 p-4 border-b-2 border-white/80">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Journey Code</Text>
              <Text className="text-xl font-bold text-gray-900">
                {journey.journeyCode}
              </Text>
            </View>
            <View className={`${config.badge} px-3 py-1.5 rounded-lg flex-row items-center gap-1`}>
              <Ionicons name={config.icon as any} size={14} color="#ffffff" />
              <Text className={`text-xs font-bold ${config.badgeText}`}>
                {config.label.toUpperCase()}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Ionicons name="airplane" size={16} color="#6b7280" />
            <Text className="text-base font-bold text-gray-900">
              {journey.route}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View className="p-4">
          {/* Traveler Info */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white font-bold text-sm">
                  {journey.travelerName[0]}
                </Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-900">
                  {journey.travelerName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {journey.travelers} traveler{journey.travelers > 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-xs text-gray-500">Departure</Text>
              <Text className="text-sm font-bold text-gray-900">
                {journey.departureDate}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-gray-600">
                Services Progress
              </Text>
              <Text className="text-xs font-bold text-gray-900">
                {journey.completedServices}/{journey.services}
              </Text>
            </View>
            <View className={`h-2 ${config.progressBg} rounded-full overflow-hidden`}>
              <View
                className={`h-full ${config.progressFill} rounded-full`}
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between pt-3 border-t border-white/80">
            <View>
              <Text className="text-xs text-gray-500">Total Amount</Text>
              <Text className="text-lg font-bold text-gray-900">
                ₹{journey.amount.toLocaleString("en-IN")}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-gray-500">Last Updated</Text>
              <Text className="text-xs font-semibold text-gray-600">
                {journey.lastUpdated}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white/80 px-4 py-3 flex-row gap-2">
          <TouchableOpacity className="flex-1 bg-blue-600 rounded-xl py-2 flex-row items-center justify-center gap-1">
            <Ionicons name="eye" size={16} color="#ffffff" />
            <Text className="text-white font-bold text-sm">View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-white border border-gray-200 rounded-xl px-4 py-2">
            <Ionicons name="share-outline" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
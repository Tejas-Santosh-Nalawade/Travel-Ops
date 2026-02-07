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

type PlanType = "economy" | "balanced" | "premium";

interface JourneyOption {
  id: string;
  type: PlanType;
  title: string;
  description: string;
  price: number;
  successRate: number;
  badge?: {
    label: string;
    color: string;
    bgColor: string;
  };
  highlight?: {
    label: string;
    color: string;
    bgColor: string;
  };
  recommended?: boolean;
}

export default function SelectJourney() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>("2");
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const options: JourneyOption[] = [
    {
      id: "1",
      type: "economy",
      title: "Economy Optimizer",
      description: "Budget-friendly choice",
      price: 45200,
      successRate: 82,
      badge: {
        label: "LOWEST PRICE",
        color: "#059669",
        bgColor: "#d1fae5",
      },
    },
    {
      id: "2",
      type: "balanced",
      title: "Balanced Reliability",
      description: "Optimal comfort & speed",
      price: 68500,
      successRate: 96,
      highlight: {
        label: "BEST VALUE",
        color: "#2563eb",
        bgColor: "#dbeafe",
      },
      badge: {
        label: "RECOMMENDED",
        color: "#ffffff",
        bgColor: "#2563eb",
      },
      recommended: true,
    },
    {
      id: "3",
      type: "premium",
      title: "Premium Direct",
      description: "Luxury experience",
      price: 112000,
      successRate: 99,
      badge: {
        label: "LUXURY",
        color: "#7c3aed",
        bgColor: "#ede9fe",
      },
    },
  ];

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleContinue = () => {
    // Navigate to payment options
    router.push("/(agent)/Create/payment");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="bg-white border-b border-gray-100">
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-900 flex-1 text-center mr-13">
            Select Journey
          </Text>
        </View>
      </View>

      {/* ================= CONTENT ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
          {/* Section Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Recommended Options
            </Text>
            <Text className="text-base text-gray-500">
              Based on your client's budget and preferences.
            </Text>
          </View>

          {/* Options List */}
          <View className="gap-4 mb-6">
            {options.map((option, index) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={selectedOption === option.id}
                onSelect={() => handleSelectOption(option.id)}
              />
            ))}
          </View>

          {/* Disclaimer */}
          <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-6">
            <View className="flex-row items-start gap-3">
              <View className="bg-blue-100 rounded-full p-2 mt-0.5">
                <Ionicons name="information-circle" size={18} color="#2563eb" />
              </View>
              <Text className="flex-1 text-sm text-gray-600 leading-relaxed">
                Prices are subject to change based on real-time availability and demand.
              </Text>
            </View>
          </View>

          {/* Features Comparison */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              What's Included
            </Text>
            <View className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <FeatureItem
                icon="checkmark-circle"
                text="24/7 Customer Support"
                included
              />
              <FeatureItem
                icon="shield-checkmark"
                text="Travel Insurance"
                included
              />
              <FeatureItem
                icon="calendar"
                text="Flexible Rebooking"
                included
              />
              <FeatureItem
                icon="sparkles"
                text="Priority Boarding"
                included={selectedOption === "3"}
              />
              <FeatureItem
                icon="restaurant"
                text="Complimentary Meals"
                included={selectedOption === "3"}
                last
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ================= BOTTOM CTA ================= */}
      <View className="bg-white border-t border-gray-100 px-5 py-4 shadow-lg">
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!selectedOption}
          className="overflow-hidden rounded-2xl shadow-lg"
        >
          <LinearGradient
            colors={
              selectedOption
                ? ["#3b82f6", "#2563eb"]
                : ["#d1d5db", "#9ca3af"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 px-6"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-lg font-bold mr-2">
                Continue with Selection
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: JourneyOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      className="relative"
    >
      {/* Highlight Banner */}
      {option.highlight && (
        <View
          className="rounded-t-2xl py-2 border-2 border-b-0"
          style={{
            backgroundColor: option.highlight.bgColor,
            borderColor: selected ? "#2563eb" : option.highlight.bgColor,
          }}
        >
          <Text
            className="text-center text-xs font-bold tracking-wider"
            style={{ color: option.highlight.color }}
          >
            {option.highlight.label}
          </Text>
        </View>
      )}

      {/* Main Card */}
      <View
        className={`bg-white rounded-2xl border-2 overflow-hidden ${
          option.highlight ? "rounded-t-none" : ""
        } ${
          selected
            ? "border-blue-600 shadow-lg shadow-blue-200"
            : "border-gray-200 shadow-sm"
        }`}
      >
        <View className="p-5">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {option.title}
              </Text>
              <Text className="text-sm text-gray-500">
                {option.description}
              </Text>
            </View>

            {/* Badge */}
            {option.badge && (
              <View
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: option.badge.bgColor }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: option.badge.color }}
                >
                  {option.badge.label}
                </Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View className="mb-4">
            <Text className="text-4xl font-extrabold text-blue-600 mb-1">
              ₹{option.price.toLocaleString("en-IN")}
            </Text>
            <Text className="text-sm text-gray-500">per person</Text>
          </View>

          {/* Success Rate */}
          <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 flex-row items-center justify-between border border-green-100">
            <View className="flex-row items-center gap-2">
              <View className="bg-green-500 rounded-full p-1.5">
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
              <Text className="text-sm font-semibold text-gray-700">
                Success Rate
              </Text>
            </View>
            <Text className="text-lg font-bold text-green-600">
              {option.successRate}%
            </Text>
          </View>
        </View>

        {/* Selection Indicator */}
        {selected && (
          <View className="bg-blue-600 py-3">
            <View className="flex-row items-center justify-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text className="text-white font-bold">Selected</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FeatureItem({
  icon,
  text,
  included,
  last,
}: {
  icon: string;
  text: string;
  included: boolean;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3 ${
        !last ? "border-b border-gray-100" : ""
      }`}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center ${
          included ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={included ? "#059669" : "#9ca3af"}
        />
      </View>
      <Text
        className={`flex-1 text-sm font-medium ${
          included ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {text}
      </Text>
      {!included && (
        <View className="bg-gray-100 px-2 py-1 rounded-md">
          <Text className="text-xs font-semibold text-gray-500">
            Premium Only
          </Text>
        </View>
      )}
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
}: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <TouchableOpacity className="items-center relative py-2 px-3">
      <View className="relative">
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
        
        {badge && badge > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
            <Text className="text-white text-xs font-bold">{badge}</Text>
          </View>
        )}
      </View>
      
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
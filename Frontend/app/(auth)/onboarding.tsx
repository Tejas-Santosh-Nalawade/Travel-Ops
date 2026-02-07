import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Role = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const roles: Role[] = [
  {
    id: "(agent)",
    icon: "briefcase",
    title: "Travel Agent",
    description: "I create and manage end-to-end journeys for customers.",
  },
  {
    id: "(ops)",
    icon: "construct",
    title: "Operations",
    description: "I resolve booking failures and keep journeys stable.",
  },
  {
    id: "(admin)",
    icon: "shield-checkmark",
    title: "Administrator",
    description: "I define rules, policies, and system-wide controls.",
  },
];

export default function OnboardingRole() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark overflow-hidden">
      <StatusBar barStyle="dark-content" />

      {/* Top App Bar */}
      <View className="flex-row items-center bg-transparent p-4 pb-2 justify-between">
        <TouchableOpacity
          className="flex items-center justify-center h-12 w-12 rounded-full"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#0d1b1a" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Headline */}
        <View className="pt-8 pb-2">
          <Text className="text-[#0d1b1a] dark:text-white text-[32px] font-extrabold text-center">
            Select your role
          </Text>
        </View>

        {/* Description */}
        <View className="pb-8">
          <Text className="text-[#4a5c5a] dark:text-gray-400 text-base font-medium text-center">
            Your role defines what you can see, control, and operate in the
            journey lifecycle.
          </Text>
        </View>

        {/* Role Selection Grid */}
        <View className="flex flex-col gap-4 mb-8">
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              className={`relative flex flex-col gap-4 p-6 rounded-xl shadow-sm active:scale-95 ${
                selectedRole === role.id
                  ? "border-2 border-primary bg-white dark:bg-[#1a2e2c]"
                  : "border-2 border-transparent bg-white dark:bg-[#1a2e2c]"
              }`}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Ionicons name={role.icon} size={32} color="#2beede" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#0d1b1a] dark:text-white text-xl font-bold">
                    {role.title}
                  </Text>
                  <Text className="text-[#4a5c5a] dark:text-gray-400 text-sm font-medium mt-1">
                    {role.description}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === role.id
                      ? "border-primary bg-primary"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {selectedRole === role.id && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View className="mt-auto p-4 gap-6">
        {/* Progress Dots */}
        <View className="flex-row justify-center gap-2">
          <View className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700" />
          <View className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700" />
          <View className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700" />
          <View className="h-2 w-6 rounded-full bg-primary" />
        </View>

        {/* Get Started Button */}
        <View className="px-4 pb-6">
          <TouchableOpacity
          disabled={!selectedRole}
            className="w-full bg-primary py-4 px-5 rounded-full shadow-lg active:scale-95"
            onPress={() => {
                if (!selectedRole) return;
              
                router.push({
                  pathname: '/sign-up',
                  params: { role: selectedRole },
                });
              }}
            activeOpacity={0.9}
          >
            <Text className="text-[#0d1b1a] text-lg font-extrabold text-center">
              Get Started
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Safe Area Spacer */}
        <View className="h-4" />
      </View>
    </View>
  );
}

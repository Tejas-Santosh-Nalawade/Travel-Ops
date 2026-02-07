import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 items-center justify-center px-6">
        
        {/* Logo/Icon Section */}
        <View className="mb-12">
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center shadow-lg">
            <Text className="text-4xl">✈️</Text>
          </View>
        </View>

        {/* Title with Colored OPS */}
        <View className="flex-row items-center justify-center mb-2">
          <Text className="text-4xl font-bold text-[#0d1b1a] dark:text-white">
            Travel
          </Text>
          <Text className="text-4xl font-bold text-[#3b82f6]">
            OPS
          </Text>
        </View>

        {/* Subtitle */}
        <Text className="text-base text-[#4c6663] dark:text-gray-300 mb-12 text-center font-semibold">
          Trip Management System
        </Text>

        {/* Primary Button */}
        <TouchableOpacity
          className="bg-[#3b82f6] px-12 py-4 rounded-full shadow-lg active:scale-95 mb-6 w-full"
          onPress={() => router.push("/(auth)/onboarding")}
          activeOpacity={0.9}
        >
          <Text className="text-white text-lg font-extrabold text-center">
            View Onboarding
          </Text>
        </TouchableOpacity>

        

        {/* Footer Text */}
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Your journey starts here
        </Text>

      </View>
    </SafeAreaView>
  );
}
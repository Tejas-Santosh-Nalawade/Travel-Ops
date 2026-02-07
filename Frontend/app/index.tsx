import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/(agent)/dashboard");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark px-6">

        <Text className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-2">
         Journeyone
        </Text>

        <Text className="text-base text-[#4c6663] dark:text-gray-300 mb-8 text-center">
          Trip Management System
        </Text>

        <TouchableOpacity
          className="bg-primary px-8 py-4 rounded-full shadow-lg active:scale-95 mb-4"
          onPress={() => router.push("/(auth)/onboarding")}
          activeOpacity={0.9}
        >
          <Text className="text-[#102220] text-lg font-extrabold">
            View Onboarding
          </Text>
        </TouchableOpacity>

        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Tap to see the onboarding flow
        </Text>

      </View>
    </SafeAreaView>
  );
}
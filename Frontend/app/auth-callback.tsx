import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase auto-exchanges token from deep link
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/(agent)/dashboard");
      } else {
        router.replace("/(auth)/sign-in");
      }
    });
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Verifying...</Text>
    </View>
  );
}
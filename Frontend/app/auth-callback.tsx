import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { getUserRole, getDashboardPath } from "../lib/roleUtils";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Supabase auto-exchanges token from deep link
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Get user role and redirect to appropriate dashboard
        const role = await getUserRole();
        
        if (role) {
          const dashboardPath = getDashboardPath(role);
          router.replace(dashboardPath as any);
        } else {
          // Default to agent if no role found
          router.replace("/(agent)/dashboard");
        }
      } else {
        router.replace("/(auth)/onboarding");
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace("/(auth)/onboarding");
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-gray-600">Verifying...</Text>
    </View>
  );
}
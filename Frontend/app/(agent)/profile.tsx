import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/onboarding");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white px-4 py-6 border-b border-gray-200">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-white">
                A
              </Text>
            </View>

            <Text className="text-lg font-bold text-gray-900">
              Travel Agent
            </Text>
            <Text className="text-sm text-gray-500">
              agent@example.com
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around bg-white py-4 border-b border-gray-200">
          <ProfileStat label="Journeys" value="24" />
          <ProfileStat label="Active" value="3" />
          <ProfileStat label="Completed" value="21" />
        </View>

        {/* Actions */}
        <View className="px-4 pt-6">
          <ProfileItem icon="person-outline" label="Edit Profile" />
          <ProfileItem icon="lock-closed-outline" label="Change Password" />
          <ProfileItem icon="notifications-outline" label="Notifications" />
          <ProfileItem icon="help-circle-outline" label="Help & Support" />

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-4 flex-row items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text className="ml-2 font-semibold text-red-600">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function ProfileItem({
  icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <TouchableOpacity className="bg-white rounded-xl px-4 py-4 mb-3 border border-gray-200 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={20} color="#2563eb" />
        <Text className="font-medium text-gray-900">
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="items-center">
      <Text className="text-xl font-bold text-gray-900">
        {value}
      </Text>
      <Text className="text-xs text-gray-500">
        {label}
      </Text>
    </View>
  );
}
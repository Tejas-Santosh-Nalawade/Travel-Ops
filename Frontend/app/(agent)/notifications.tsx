import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Notifications() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 bg-white">
        <Text className="text-xl font-bold text-gray-900">
          Notifications
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          Recent alerts & updates
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Success */}
        <NotificationCard
          icon="checkmark-done"
          iconBg="bg-green-100"
          iconColor="#10b981"
          title="Journey Completed"
          message="Mumbai → Dubai journey has been successfully completed."
          time="2 hours ago"
        />

        {/* Warning */}
        <NotificationCard
          icon="alert-circle"
          iconBg="bg-yellow-100"
          iconColor="#f59e0b"
          title="Action Required"
          message="Passenger documents pending for Delhi → Paris."
          time="Yesterday"
        />

        {/* Info */}
        <NotificationCard
          icon="information-circle"
          iconBg="bg-blue-100"
          iconColor="#3b82f6"
          title="New Assignment"
          message="You have been assigned a new journey request."
          time="2 days ago"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENT ================= */

function NotificationCard({
  icon,
  iconBg,
  iconColor,
  title,
  message,
  time,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  message: string;
  time: string;
}) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      <View className="flex-row items-start gap-3">
        <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center`}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-gray-900">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {message}
          </Text>
          <Text className="text-xs text-gray-400 mt-2">
            {time}
          </Text>
        </View>
      </View>
    </View>
  );
}
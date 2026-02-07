import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type NotificationType = "booking" | "payment" | "flight_update" | "promotion" | "alert" | "reminder";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
  action_label: string | null;
  expires_at: string | null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${supabase.auth.getUser()}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function loadNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_user_notifications", {
        p_user_id: user.id,
        p_is_read: filter === "unread" ? false : null,
        p_limit: 50,
      });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to mark as read");
    }
  }

  async function markAllAsRead() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      loadNotifications();
      Alert.alert("Success", "All notifications marked as read");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to mark all as read");
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 bg-white">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">Notifications</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </Text>
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllAsRead}
              className="px-3 py-1.5 bg-blue-600 rounded-lg active:bg-blue-700"
            >
              <Text className="text-xs font-medium text-white">Mark All Read</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2 mt-3">
          <Pressable
            onPress={() => setFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === "all" ? "text-white" : "text-gray-700"
              }`}
            >
              All ({notifications.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("unread")}
            className={`px-4 py-2 rounded-full ${
              filter === "unread" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === "unread" ? "text-white" : "text-gray-700"
              }`}
            >
              Unread ({unreadCount})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadNotifications();
          }} />
        }
      >
        {loading ? (
          <View className="py-12 items-center">
            <Text className="text-gray-500">Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="py-12 items-center">
            <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 mt-3 text-center">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENT ================= */

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const { icon, iconBg, iconColor } = getNotificationStyle(notification.type);
  const priorityBadge = getPriorityBadge(notification.priority);

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  return (
    <Pressable
      onPress={() => !notification.is_read && onMarkAsRead(notification.id)}
      className={`rounded-xl p-4 mb-3 border ${
        notification.is_read
          ? "bg-white border-gray-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center`}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text
              className={`font-semibold ${
                notification.is_read ? "text-gray-900" : "text-blue-900"
              }`}
            >
              {notification.title}
            </Text>
            {priorityBadge && (
              <View
                className={`px-2 py-0.5 rounded ${priorityBadge.bg}`}
              >
                <Text className={`text-xs font-bold ${priorityBadge.text}`}>
                  {priorityBadge.label}
                </Text>
              </View>
            )}
            {!notification.is_read && (
              <View className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </View>

          <Text
            className={`text-sm ${
              notification.is_read ? "text-gray-600" : "text-gray-800"
            } mt-1`}
          >
            {notification.message}
          </Text>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-gray-400">
              {formatTime(notification.created_at)}
            </Text>

            {notification.action_url && notification.action_label && (
              <Pressable className="px-3 py-1 bg-blue-600 rounded active:bg-blue-700">
                <Text className="text-xs font-medium text-white">
                  {notification.action_label}
                </Text>
              </Pressable>
            )}
          </View>

          {notification.expires_at && (
            <Text className="text-xs text-orange-600 mt-1">
              Expires: {new Date(notification.expires_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function getNotificationStyle(type: NotificationType): {
  icon: any;
  iconBg: string;
  iconColor: string;
} {
  switch (type) {
    case "booking":
      return {
        icon: "checkmark-done",
        iconBg: "bg-green-100",
        iconColor: "#10b981",
      };
    case "payment":
      return {
        icon: "card",
        iconBg: "bg-blue-100",
        iconColor: "#3b82f6",
      };
    case "flight_update":
      return {
        icon: "airplane",
        iconBg: "bg-purple-100",
        iconColor: "#8b5cf6",
      };
    case "promotion":
      return {
        icon: "pricetag",
        iconBg: "bg-yellow-100",
        iconColor: "#f59e0b",
      };
    case "alert":
      return {
        icon: "alert-circle",
        iconBg: "bg-red-100",
        iconColor: "#ef4444",
      };
    case "reminder":
      return {
        icon: "time",
        iconBg: "bg-orange-100",
        iconColor: "#f97316",
      };
    default:
      return {
        icon: "information-circle",
        iconBg: "bg-gray-100",
        iconColor: "#6b7280",
      };
  }
}

function getPriorityBadge(priority: NotificationPriority): {
  label: string;
  bg: string;
  text: string;
} | null {
  switch (priority) {
    case "urgent":
      return { label: "URGENT", bg: "bg-red-100", text: "text-red-700" };
    case "high":
      return { label: "HIGH", bg: "bg-orange-100", text: "text-orange-700" };
    default:
      return null;
  }
}
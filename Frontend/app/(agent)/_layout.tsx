import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AgentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#ffffff",
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="journeys"
        options={{
          title: "Journeys",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => (
<<<<<<< HEAD
            <Ionicons name="add-circle" size={36} color="#2563eb" />
=======
            <Ionicons name="add-circle" size={30} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
>>>>>>> 5d4be93f63d8c626f810221aa30b82b978ee7a0d
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700",
          },
        }}
      />
    </Tabs>
  );
}

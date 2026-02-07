import { Stack } from "expo-router";

export default function AgentHomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="ai-packages" />
      <Stack.Screen name="budget-packages" />
      <Stack.Screen name="credit-packages" />
      <Stack.Screen name="package-options" />
      <Stack.Screen name="recommendations" />
      <Stack.Screen name="search" />

    </Stack>
  );
}
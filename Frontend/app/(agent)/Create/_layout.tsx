import { Stack } from "expo-router";

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="create"
        options={{
          headerTitle: "Create Journey",
        }}
      />
      <Stack.Screen
        name="selectjourney"
        options={{
          headerTitle: "Select Journey",
        }}
      />
      <Stack.Screen
        name="journey"
        options={{
          headerTitle: "Journey Details",
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          headerTitle: "Payment",
        }}
      />
    </Stack>
  );
}
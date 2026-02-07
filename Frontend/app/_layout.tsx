
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(agent)" />
        <Stack.Screen name="(ops)" />
        <Stack.Screen name="auth-callback" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />

    </SafeAreaProvider>
  );
}

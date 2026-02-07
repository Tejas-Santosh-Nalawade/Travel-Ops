import { Stack } from "expo-router";

export default function HomeLayout() {
    return (
        <Stack>
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        </Stack>
    );
}

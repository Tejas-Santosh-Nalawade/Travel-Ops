import { Stack } from "expo-router";

export default function Opslayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" />
        </Stack>
    );
}
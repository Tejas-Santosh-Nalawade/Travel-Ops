import { Stack } from "expo-router";

export default function JourneyLayout() {
    return (
        <Stack>
            <Stack.Screen name="journeys" options={{ headerShown: false }} />
            <Stack.Screen name="[id]" options={{ headerShown: false }} />
        </Stack>
    );
}

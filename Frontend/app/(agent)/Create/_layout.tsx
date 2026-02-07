import { Stack } from "expo-router";

export default function CreateLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
            name="create"
            options={{
            headerTitle: "Create",
            }}
        />
        <Stack.Screen
            name="create/selectjourney"
            options={{
            headerTitle: "Create Agent",
            }}
        />
        <Stack.Screen
            name="create/journey"
            options={{
            headerTitle: "Create Journey",
            }}
        />
        </Stack>
    );
    }
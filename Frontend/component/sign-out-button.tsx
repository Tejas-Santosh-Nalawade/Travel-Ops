import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function SignedOutButton() {
  const router = useRouter();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert(error.message);
    } else {
      router.replace("/sign-in");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">

      <Pressable
        onPress={signOut}
        className="bg-red-500 px-8 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">
          Sign Out
        </Text>
      </Pressable>

    </View>
  );
}
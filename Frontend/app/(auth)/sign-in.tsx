import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useLocalSearchParams} from "expo-router";

/* ================= ROLE REDIRECT ================= */

const redirectByRole = (role: string) => {
  switch (role) {
    case "(agent)":
      return "/(agent)/dashboard";
    case "(ops)":
      return "/(ops)/dashboard";
    case "(admin)":
      return "/(admin)/dashboard";
    default:
      return "/(agent)/dashboard";
  }
};

export default function SignIn() {
  const router = useRouter();
  const  {role} = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= SIGN IN ================= */

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Enter email and password");
      return;
    }


    try {
      setLoading(true);

      // 1️⃣ AUTHENTICATE (NO ROLE HERE)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data?.user) {
        Alert.alert("Sign In Failed", error?.message ?? "Unknown error");
        return;
      }

      console.log(role);
      if (!role) {
        Alert.alert("Role Missing", "Role not found in user metadata");
        return;
      }

      // 3️⃣ REDIRECT
      router.replace(redirectByRole(role));
    } catch (err) {
      console.error(err);
      Alert.alert("Network Error", "Please try again");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center">
        <View className="px-8 py-12">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-lg text-gray-600">
              Sign in to continue
            </Text>
          </View>

          {/* Email */}
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="border border-gray-300 rounded-2xl px-5 py-4 bg-white mb-4"
          />

          {/* Password */}
          <View className="relative mb-6">
            <TextInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              className="border border-gray-300 rounded-2xl px-5 py-4 pr-12 bg-white"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4"
            >
              <Text className="text-gray-500">
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Button */}
          <Pressable
            onPress={signIn}
            disabled={loading}
            className={`py-4 rounded-2xl items-center ${
              loading ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Sign In
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
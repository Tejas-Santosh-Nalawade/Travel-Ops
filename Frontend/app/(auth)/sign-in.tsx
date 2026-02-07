import { useLocalSearchParams, useRouter } from "expo-router";
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
<<<<<<< tejas/operation

const roleTitleMap: Record<string, string> = {
  "(agent)": "Travel Agent",
  "(ops)": "Operations",
  "(admin)": "Administrator",
};

const redirectByRole = (role?: string) => {
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
=======
import { useLocalSearchParams } from "expo-router";
import { getUserRole, getDashboardPath } from "../../lib/roleUtils";
>>>>>>> local

export default function SignIn() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
<<<<<<< tejas/operation

=======
>>>>>>> local
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const signIn = async () => {
<<<<<<< tejas/operation
=======
    if (!email || !password) {
      Alert.alert("Missing Fields", "Enter email and password");
      return;
    }

>>>>>>> local
    try {
      setErrors({ email: "", password: "" });

      if (!email || !password) {
        Alert.alert("Missing Fields", "Please enter both email and password");
        return;
      }

      if (!validateEmail(email)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
        Alert.alert("Invalid Email", "Please enter a valid email address");
        return;
      }

      setLoading(true);

<<<<<<< tejas/operation
=======
      // Authenticate user
>>>>>>> local
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({
            email: "Invalid credentials",
            password: "Invalid credentials",
          });
          Alert.alert(
            "Sign In Failed",
            "The email or password you entered is incorrect."
          );
          return;
        }

        if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email Not Verified",
            "Please verify your email before signing in."
          );
          return;
        }

        Alert.alert("Sign In Error", error.message);
        return;
      }

<<<<<<< tejas/operation
      if (data?.user) {
        router.replace(redirectByRole(role));
=======
      // Get user role from profile
      const userRole = await getUserRole();

      if (userRole) {
        const dashboardPath = getDashboardPath(userRole);
        router.replace(dashboardPath as any);
      } else {
        // Fallback to agent if no role found
        router.replace("/(agent)/dashboard");
>>>>>>> local
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Connection Error",
        "Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 py-12">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-lg text-gray-600">
              Sign in as {roleTitleMap[role ?? "(agent)"]}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <TextInput
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onBlur={handleEmailBlur}
                editable={!loading}
                className={`border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-2xl px-5 py-4 bg-white`}
              />
              {errors.email ? (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.email}
                </Text>
              ) : null}
            </View>

            {/* Password */}
            <View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm font-medium text-gray-700">
                  Password
                </Text>
              </View>
              <View className="relative">
                <TextInput
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  className={`border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-2xl px-5 py-4 pr-12 bg-white`}
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
            </View>

            {/* Sign In Button */}
            <Pressable
              disabled={loading}
              onPress={signIn}
              className={`${
                loading ? "bg-blue-400" : "bg-blue-600"
              } py-4 rounded-2xl items-center`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Sign Up */}
            <View className="flex-row justify-center">
              <Text className="text-gray-600">
                Don’t have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/sign-up",
                    params: { role },
                  })
                }
              >
                <Text className="text-blue-600 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
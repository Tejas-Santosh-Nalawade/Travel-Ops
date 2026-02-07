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

export default function SignUp() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const name = role === "(agent)" ? "Agent Smith" : role === "(ops)" ? "Ops Taylor" : role === "(admin)" ? "Admin Lee" : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const validatePassword = (
    password: string
  ): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain an uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain a lowercase letter",
      };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Password must contain a number" };
    }
    return { isValid: true, message: "" };
  };

  // Real-time field validation
  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordBlur = () => {
    if (password) {
      const validation = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: validation.message }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && password !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const signUp = async () => {
    try {
      // Clear previous errors
      setErrors({ name: " ", email: "", password: "", confirmPassword: "" });

      // Validation checks
      if (!email || !password || !confirmPassword) {
        Alert.alert("Missing Fields", "Please fill in all required fields");
        return;
      }

      if (!validateEmail(email)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
        Alert.alert("Invalid Email", "Please enter a valid email address");
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          password: passwordValidation.message,
        }));
        Alert.alert("Weak Password", passwordValidation.message);
        return;
      }

      if (password !== confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
        Alert.alert("Password Mismatch", "Passwords do not match");
        return;
      }

      setIsLoading(true);

      // Parse role from route param (remove parentheses)
      const userRole = role?.replace(/[()]/g, '').toLowerCase() || 'agent';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: userRole, // Store role in metadata
          },
          emailRedirectTo: "meltdown://auth-callback",
        },
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes("already registered")) {
          Alert.alert(
            "Account Exists",
            "This email is already registered. Would you like to sign in instead?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign In", onPress: () => router.replace("/sign-in") },
            ]
          );
        } else if (error.message.includes("invalid email")) {
          setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
          Alert.alert("Invalid Email", "Please check your email address");
        } else if (error.message.includes("password")) {
          setErrors((prev) => ({ ...prev, password: error.message }));
          Alert.alert("Password Error", error.message);
        } else {
          Alert.alert("Sign Up Failed", error.message);
        }
      } else if (data?.user) {
        Alert.alert(
          "Success!",
          "Please check your email for a verification link to complete your registration.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/sign-in"),
            },
          ]
        );
      } else {
        // Unexpected case where no error but no user
        Alert.alert("Unknown Error", "Something went wrong. Please try again.");
      }
    } catch (err) {
      // Network or unexpected errors
      console.error("Sign up error:", err);
      Alert.alert(
        "Connection Error",
        "Unable to connect. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
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
              Create Account
            </Text>
            <Text className="text-lg text-gray-600">
              Join us to get started
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5">
            
            {/* Email Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <TextInput
                placeholder="you@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: "" }));
                }}
                onBlur={handleEmailBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                className={`border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-2xl px-5 py-4 text-base bg-white shadow-sm`}
              />
              {errors.email ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.email}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  placeholder="Enter strong password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  onBlur={handlePasswordBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  className={`border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-2xl px-5 py-4 pr-12 text-base bg-white shadow-sm`}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                  disabled={isLoading}
                >
                  <Text className="text-gray-500 text-sm font-medium">
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.password}
                </Text>
              ) : null}
            </View>

            {/* Confirm Password Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  onBlur={handleConfirmPasswordBlur}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  className={`border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-2xl px-5 py-4 pr-12 text-base bg-white shadow-sm`}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-4"
                  disabled={isLoading}
                >
                  <Text className="text-gray-500 text-sm font-medium">
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>

            {/* Password Requirements */}
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <Text className="text-xs font-semibold text-blue-900 mb-2">
                Password must contain:
              </Text>
              <Text className="text-xs text-blue-800">
                • At least 8 characters
              </Text>
              <Text className="text-xs text-blue-800">
                • One uppercase letter
              </Text>
              <Text className="text-xs text-blue-800">
                • One lowercase letter
              </Text>
              <Text className="text-xs text-blue-800">• One number</Text>
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={signUp}
              disabled={isLoading}
              className={`${isLoading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"} py-4 rounded-2xl items-center shadow-lg mt-2`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Create Account
                </Text>
              )}
            </Pressable>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600 text-base">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/sign-in")}
                disabled={isLoading}
              >
                <Text className="text-blue-600 font-semibold text-base">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

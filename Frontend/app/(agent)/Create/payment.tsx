import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PaymentMethod = "cash" | "credit-card" | "direct";

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  features: string[];
  recommended?: boolean;
}

export default function PaymentOptions() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const paymentOptions: PaymentOption[] = [
    {
      id: "cash",
      title: "Cash / Content Creator",
      subtitle: "Pay with cash or through social media content",
      icon: "cash",
      iconColor: "#10b981",
      bgColor: "#ecfdf5",
      borderColor: "#10b981",
      badge: "POPULAR",
      features: [
        "Share Instagram post/reel",
        "Upload content URL",
        "Instant verification",
        "Flexible payment terms",
      ],
    },
    {
      id: "credit-card",
      title: "Credit / Debit Card",
      subtitle: "Secure payment with your card",
      icon: "card",
      iconColor: "#3b82f6",
      bgColor: "#eff6ff",
      borderColor: "#3b82f6",
      badge: "SECURE",
      recommended: true,
      features: [
        "Instant booking confirmation",
        "EMI options available",
        "256-bit encryption",
        "Reward points eligible",
      ],
    },
    {
      id: "direct",
      title: "Direct Bank Transfer",
      subtitle: "Transfer directly to our account",
      icon: "business",
      iconColor: "#f59e0b",
      bgColor: "#fef3c7",
      borderColor: "#f59e0b",
      features: [
        "Lower processing fees",
        "Bank-to-bank transfer",
        "Manual verification",
        "24-48 hours processing",
      ],
    },
  ];

  const handlePaymentMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleProceedPayment = async () => {
    if (!selectedMethod) {
      Alert.alert("Select Payment Method", "Please choose a payment method to continue.");
      return;
    }

    if (selectedMethod === "cash") {
      if (!instagramUrl && !contentUrl) {
        Alert.alert("Content Required", "Please provide an Instagram URL or content URL.");
        return;
      }
      
      Alert.alert(
        "Content Submitted",
        "Your content has been submitted for verification. We'll confirm your booking shortly.",
        [{ text: "OK", onPress: () => router.push("/(agent)/Create/journey") }]
      );
    } else if (selectedMethod === "credit-card") {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardHolder) {
        Alert.alert("Card Details Required", "Please fill in all card details.");
        return;
      }
      
      // Simulate payment processing
      Alert.alert(
        "Payment Successful",
        "Your payment has been processed successfully!",
        [{ text: "OK", onPress: () => router.push("/(agent)/Create/journey") }]
      );
    } else if (selectedMethod === "direct") {
      Alert.alert(
        "Transfer Instructions",
        "Please transfer the amount to:\nAccount: 1234567890\nIFSC: BANK0001234\nReference: JRN-" + Math.floor(Math.random() * 10000),
        [{ text: "OK", onPress: () => router.push("/(agent)/Create/journey") }]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="bg-white border-b border-gray-100">
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              Payment Method
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Choose how you'd like to pay
            </Text>
          </View>
        </View>
      </View>

      {/* ================= CONTENT ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
          {/* Payment Options */}
          <View className="mb-6">
            <Text className="text-base font-bold text-gray-800 mb-4">
              Select Payment Method
            </Text>

            <View className="gap-4">
              {paymentOptions.map((option) => (
                <PaymentCard
                  key={option.id}
                  option={option}
                  selected={selectedMethod === option.id}
                  onSelect={() => handlePaymentMethod(option.id)}
                />
              ))}
            </View>
          </View>

          {/* Payment Details Form */}
          {selectedMethod === "cash" && (
            <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Content Creator Payment
              </Text>
              
              <Text className="text-sm text-gray-600 mb-4">
                Share your travel experience on Instagram or provide a content URL to complete the booking
              </Text>

              {/* Instagram URL */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Instagram Post/Reel URL
                </Text>
                <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                  <Ionicons name="logo-instagram" size={20} color="#e91e63" />
                  <TextInput
                    placeholder="https://instagram.com/p/..."
                    placeholderTextColor="#9ca3af"
                    value={instagramUrl}
                    onChangeText={setInstagramUrl}
                    className="flex-1 ml-3 text-gray-900"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* OR Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="text-gray-500 mx-4 font-medium">OR</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Content URL */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Other Content URL
                </Text>
                <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                  <Ionicons name="link" size={20} color="#3b82f6" />
                  <TextInput
                    placeholder="https://..."
                    placeholderTextColor="#9ca3af"
                    value={contentUrl}
                    onChangeText={setContentUrl}
                    className="flex-1 ml-3 text-gray-900"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Info Box */}
              <View className="bg-green-50 rounded-xl p-4 border border-green-200">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={20} color="#10b981" />
                  <Text className="flex-1 text-xs text-green-700 ml-2">
                    Your content will be reviewed within 2 hours. Once approved, your booking will be confirmed automatically.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedMethod === "credit-card" && (
            <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Card Details
              </Text>

              {/* Card Holder Name */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Cardholder Name
                </Text>
                <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                  <Ionicons name="person" size={20} color="#6b7280" />
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#9ca3af"
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    className="flex-1 ml-3 text-gray-900"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Card Number */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Card Number
                </Text>
                <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                  <Ionicons name="card" size={20} color="#3b82f6" />
                  <TextInput
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#9ca3af"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    className="flex-1 ml-3 text-gray-900"
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
              </View>

              {/* Expiry and CVV */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Expiry Date
                  </Text>
                  <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                    <Ionicons name="calendar" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="MM/YY"
                      placeholderTextColor="#9ca3af"
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      className="flex-1 ml-3 text-gray-900"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    CVV
                  </Text>
                  <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                    <Ionicons name="lock-closed" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="123"
                      placeholderTextColor="#9ca3af"
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      className="flex-1 ml-3 text-gray-900"
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>

              {/* Security Badge */}
              <View className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex-row items-center">
                <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-blue-900">
                    Secure Payment
                  </Text>
                  <Text className="text-xs text-blue-700 mt-0.5">
                    Your card details are encrypted and secure
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedMethod === "direct" && (
            <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Bank Transfer Details
              </Text>

              <View className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
                <View className="flex-row items-start mb-3">
                  <Ionicons name="business" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-amber-900">
                      Bank Name
                    </Text>
                    <Text className="text-base text-amber-800 font-bold mt-1">
                      State Bank of India
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-3">
                  <Ionicons name="card" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-amber-900">
                      Account Number
                    </Text>
                    <Text className="text-base text-amber-800 font-bold mt-1">
                      1234567890123456
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-3">
                  <Ionicons name="key" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-amber-900">
                      IFSC Code
                    </Text>
                    <Text className="text-base text-amber-800 font-bold mt-1">
                      SBIN0001234
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Ionicons name="receipt" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold text-amber-900">
                      Reference Code
                    </Text>
                    <Text className="text-base text-amber-800 font-bold mt-1">
                      JRN-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-start">
                  <Ionicons name="alert-circle" size={20} color="#6b7280" />
                  <Text className="flex-1 text-xs text-gray-700 ml-2">
                    After completing the transfer, please share the transaction screenshot or UTR number with our support team for verification.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ================= FOOTER ================= */}
      {selectedMethod && (
        <View className="bg-white border-t border-gray-200 px-5 py-4">
          <TouchableOpacity
            onPress={handleProceedPayment}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#3b82f6", "#2563eb"]}
              className="rounded-2xl py-4 items-center justify-center shadow-lg"
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">
                  {selectedMethod === "cash" ? "Submit Content" : 
                   selectedMethod === "credit-card" ? "Pay Now" : 
                   "Confirm Transfer"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function PaymentCard({
  option,
  selected,
  onSelect,
}: {
  option: PaymentOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      className={`rounded-2xl p-5 border-2 ${
        selected
          ? `border-${option.borderColor} bg-white shadow-lg`
          : "border-gray-200 bg-white"
      }`}
      style={{
        borderColor: selected ? option.borderColor : "#e5e7eb",
      }}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-start flex-1">
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: option.bgColor }}
          >
            <Ionicons name={option.icon} size={24} color={option.iconColor} />
          </View>

          {/* Title */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg font-bold text-gray-900 mr-2">
                {option.title}
              </Text>
              {option.badge && (
                <View
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: option.bgColor }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: option.iconColor }}
                  >
                    {option.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-gray-500">{option.subtitle}</Text>
          </View>
        </View>

        {/* Radio Button */}
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ml-2 ${
            selected ? "border-blue-600" : "border-gray-300"
          }`}
        >
          {selected && (
            <View className="w-3 h-3 rounded-full bg-blue-600" />
          )}
        </View>
      </View>

      {/* Features */}
      <View className="gap-2">
        {option.features.map((feature, index) => (
          <View key={index} className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color={option.iconColor} />
            <Text className="text-xs text-gray-600 ml-2">{feature}</Text>
          </View>
        ))}
      </View>

      {/* Recommended Badge */}
      {option.recommended && (
        <View className="absolute -top-2 -right-2 bg-blue-600 rounded-full px-3 py-1 shadow-md">
          <Text className="text-xs font-bold text-white">⭐ RECOMMENDED</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

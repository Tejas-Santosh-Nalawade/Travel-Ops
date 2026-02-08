/**
 * Credit Card Recommendations - AI Powered
 * Shows personalized card recommendations based on spending patterns
 */
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { creditCardService, CardRecommendation } from '../../../services/creditCardAPI';

export default function CreditCardRecommendations() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Form state
  const [monthlySpend, setMonthlySpend] = useState('');
  const [travelSpend, setTravelSpend] = useState('');
  const [travelFrequency, setTravelFrequency] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getRecommendations = async () => {
    if (!monthlySpend) {
      Alert.alert('Missing Information', 'Please enter your monthly spending');
      return;
    }

    try {
      setLoading(true);
      setRecommendations([]);

      const result = await creditCardService.getRecommendations({
        monthly_spend: parseFloat(monthlySpend),
        spend_categories: {
          travel: parseFloat(travelSpend) || 0,
        },
        travel_frequency: parseInt(travelFrequency) || 0,
      });

      setRecommendations(result);

      if (result.length === 0) {
        Alert.alert('No Results', 'No suitable cards found. Try adjusting your criteria.');
      }
    } catch (error: any) {
      console.error('Recommendation error:', error);
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-500 px-6 py-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Credit Card Finder 💳
            </Text>
            <Text className="text-green-100 text-sm">AI-powered recommendations</Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView className="flex-1" style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View className="mx-6 mt-4 mb-6 bg-white rounded-3xl p-6 shadow-lg border-2 border-green-200">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 rounded-full p-3 mr-3">
              <Ionicons name="card" size={24} color="#10b981" />
            </View>
            <Text className="text-xl font-extrabold text-gray-900">Your Spending Profile</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Monthly Spending (₹)</Text>
            <TextInput
              placeholder="50000"
              keyboardType="numeric"
              value={monthlySpend}
              onChangeText={setMonthlySpend}
              className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Travel Spending (₹/month)</Text>
            <TextInput
              placeholder="10000"
              keyboardType="numeric"
              value={travelSpend}
              onChangeText={setTravelSpend}
              className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Travel Frequency (trips/year)</Text>
            <TextInput
              placeholder="6"
              keyboardType="numeric"
              value={travelFrequency}
              onChangeText={setTravelFrequency}
              className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={getRecommendations}
            disabled={loading}
            className="bg-green-500 rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={22} color="#fff" />
                <Text className="text-white font-extrabold text-center ml-2 text-lg">
                  Find Best Cards
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {recommendations.length > 0 && (
          <View className="mx-6 mb-6">
            <Text className="text-2xl font-extrabold text-gray-900 mb-4">
              🎯 Top Recommendations
            </Text>

            {recommendations.map((rec, index) => (
              <View key={index} className="bg-white rounded-3xl p-6 mb-4 shadow-lg border-2 border-green-200">
                {/* Card Header */}
                <View className="bg-green-500 rounded-2xl p-4 mb-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-white text-2xl font-extrabold mb-1">
                        {rec.card.card_name}
                      </Text>
                      <Text className="text-green-100 text-sm uppercase tracking-wide">
                        {rec.card.card_tier} • {rec.card.card_type}
                      </Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-extrabold">#{index + 1}</Text>
                    </View>
                  </View>
                </View>

                {/* Annual Value */}
                <View className="bg-green-50 rounded-2xl p-4 mb-4">
                  <Text className="text-gray-700 text-sm mb-2">Estimated Annual Value</Text>
                  <Text className="text-green-600 text-3xl font-extrabold">
                    {formatPrice(rec.estimated_annual_value)}
                  </Text>
                  {rec.card.annual_fee > 0 && (
                    <Text className="text-gray-600 text-sm mt-1">
                      ROI: {rec.roi_percent.toFixed(0)}% (Annual fee: {formatPrice(rec.card.annual_fee)})
                    </Text>
                  )}
                </View>

                {/* Recommended For */}
                <View className="mb-4">
                  <Text className="text-gray-800 font-bold mb-2">✨ Why This Card:</Text>
                  <Text className="text-gray-600">{rec.recommended_for}</Text>
                </View>

                {/* Key Features */}
                <View className="mb-4">
                  <Text className="text-gray-800 font-bold mb-2">🎁 Key Features:</Text>
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={16} color="#10b981" />
                      <Text className="ml-2 text-gray-600">
                        {rec.card.reward_rate} points per ₹100 spent
                      </Text>
                    </View>
                    {rec.card.cashback_percent > 0 && (
                      <View className="flex-row items-center">
                        <Ionicons name="cash" size={16} color="#10b981" />
                        <Text className="ml-2 text-gray-600">
                          {rec.card.cashback_percent}% cashback
                        </Text>
                      </View>
                    )}
                    {rec.card.airport_lounge_access && (
                      <View className="flex-row items-center">
                        <Ionicons name="airplane" size={16} color="#10b981" />
                        <Text className="ml-2 text-gray-600">
                          {rec.card.free_lounge_visits} free airport lounge visits/year
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Travel Benefits */}
                {rec.travel_benefits.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-gray-800 font-bold mb-2">✈️ Travel Benefits:</Text>
                    {rec.travel_benefits.map((benefit, i) => (
                      <View key={i} className="bg-blue-50 rounded-xl p-3 mb-2">
                        <Text className="text-blue-900 font-semibold mb-1">
                          {benefit.benefit_type}
                        </Text>
                        <Text className="text-blue-700 text-sm">{benefit.description}</Text>
                        <Text className="text-blue-600 text-xs mt-1">
                          Est. Value: {formatPrice(benefit.value_estimate)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Active Offers */}
                {rec.active_offers.length > 0 && (
                  <View>
                    <Text className="text-gray-800 font-bold mb-2">🎉 Active Offers:</Text>
                    {rec.active_offers.map((offer, i) => (
                      <View key={i} className="bg-orange-50 rounded-xl p-3 mb-2">
                        <Text className="text-orange-900 font-semibold">
                          {offer.merchant} - {offer.discount_percent}% OFF
                        </Text>
                        <Text className="text-orange-700 text-sm">
                          Max discount: {formatPrice(offer.max_discount)}
                        </Text>
                        <Text className="text-orange-600 text-xs">{offer.terms}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {loading && (
          <View className="mx-6 bg-white p-12 rounded-3xl items-center mb-6">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-gray-600 mt-4 font-semibold">
              Finding best cards for you...
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

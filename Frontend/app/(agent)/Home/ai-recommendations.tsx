/**
 * AI-Powered Travel Recommendations Screen
 * Replaces RPC calls with AI Orchestrator API
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { travelOrchestrator } from '../../../services/orchestratorAPI';

type RecommendationType = 'budget' | 'multi_city' | 'quick';

export default function AIRecommendations() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<RecommendationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [travelPlan, setTravelPlan] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Budget form
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [numTravelers, setNumTravelers] = useState('2');

  // Multi-city form
  const [cities, setCities] = useState(['Pune', 'Mumbai', 'Bangalore']);
  const [travelDays, setTravelDays] = useState('6');
  const [preference, setPreference] = useState<'cheapest' | 'fastest' | 'balanced' | 'comfort'>('balanced');

  // Quick trip form
  const [fromCity, setFromCity] = useState('Pune');
  const [toCity, setToCity] = useState('Mumbai');
  const [quickBudget, setQuickBudget] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getBudgetRecommendations = async () => {
    if (!budgetMin || !budgetMax) {
      Alert.alert('Missing Information', 'Please enter your budget range');
      return;
    }

    try {
      setLoading(true);
      setTravelPlan(null);
      setInsights(null);

      const budget = (parseFloat(budgetMin) + parseFloat(budgetMax)) / 2;

      // Create AI-powered plan
      const result = await travelOrchestrator.createEnhancedPlan({
        customer_name: 'Budget Traveler',
        customer_email: 'traveler@example.com',
        customer_phone: '+919876543210',
        total_budget: budget,
        cities: [
          {
            city: 'Pune',
            duration_days: 2,
            arrival_date: new Date().toISOString().split('T')[0],
            departure_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          {
            city: 'Mumbai',
            duration_days: 3,
            arrival_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            departure_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        ],
        preference: 'cheapest',
        number_of_travelers: parseInt(numTravelers) || 2,
        accommodation_type: 'budget',
      });

      setTravelPlan(result.travel_plan);
      setInsights(result.insights);

      Alert.alert(
        result.ui_summary?.title || 'Success!',
        result.ui_summary?.summary || 'AI-powered travel plan created!'
      );
    } catch (error: any) {
      console.error('Budget recommendations error:', error);
      Alert.alert('Error', 'Failed to get AI recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMultiCityRecommendations = async () => {
    if (!travelDays || cities.length < 2) {
      Alert.alert('Missing Information', 'Please select at least 2 cities and duration');
      return;
    }

    try {
      setLoading(true);
      setTravelPlan(null);
      setInsights(null);

      const daysPerCity = Math.floor(parseInt(travelDays) / cities.length);
      let currentDate = new Date();

      const cityRequests = cities.map((city, index) => {
        const arrivalDate = new Date(currentDate);
        currentDate = new Date(currentDate.getTime() + daysPerCity * 24 * 60 * 60 * 1000);
        const departureDate = new Date(currentDate);

        return {
          city,
          duration_days: daysPerCity,
          arrival_date: arrivalDate.toISOString().split('T')[0],
          departure_date: departureDate.toISOString().split('T')[0],
        };
      });

      const budget = parseFloat(budgetMax || '50000');

      const result = await travelOrchestrator.createEnhancedPlan({
        customer_name: 'Multi-City Traveler',
        customer_email: 'traveler@example.com',
        customer_phone: '+919876543210',
        total_budget: budget,
        cities: cityRequests,
        preference,
        number_of_travelers: parseInt(numTravelers) || 2,
        accommodation_type: 'mid_range',
      });

      setTravelPlan(result.travel_plan);
      setInsights(result.insights);

      Alert.alert(
        result.ui_summary?.title || 'Success!',
        result.ui_summary?.summary || 'AI-optimized multi-city plan ready!'
      );
    } catch (error: any) {
      console.error('Multi-city recommendations error:', error);
      Alert.alert('Error', 'Failed to create multi-city plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQuickTripPlan = async () => {
    if (!fromCity || !toCity || !quickBudget) {
      Alert.alert('Missing Information', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setTravelPlan(null);
      setInsights(null);

      const result = await travelOrchestrator.createEnhancedPlan({
        customer_name: 'Quick Traveler',
        customer_email: 'traveler@example.com',
        customer_phone: '+919876543210',
        total_budget: parseFloat(quickBudget),
        cities: [
          {
            city: fromCity,
            duration_days: 0,
            arrival_date: new Date().toISOString().split('T')[0],
            departure_date: new Date().toISOString().split('T')[0],
          },
          {
            city: toCity,
            duration_days: 2,
            arrival_date: new Date().toISOString().split('T')[0],
            departure_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        ],
        preference: 'fastest',
        number_of_travelers: parseInt(numTravelers) || 2,
        accommodation_type: 'mid_range',
      });

      setTravelPlan(result.travel_plan);
      setInsights(result.insights);

      Alert.alert(
        result.ui_summary?.title || 'Success!',
        result.ui_summary?.summary || 'Quick trip plan ready!'
      );
    } catch (error: any) {
      console.error('Quick trip error:', error);
      Alert.alert('Error', 'Failed to create quick trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 py-6 pb-8"
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              AI Travel Planner 🤖
            </Text>
            <Text className="text-purple-100 text-sm">Powered by Groq LLM</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView className="flex-1" style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
        {/* Recommendation Type Selector */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Choose Your Planning Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {[
                { id: 'budget' as const, icon: 'cash', label: 'Budget Travel', color: '#10b981' },
                { id: 'multi_city' as const, icon: 'map', label: 'Multi-City', color: '#6366f1' },
                { id: 'quick' as const, icon: 'flash', label: 'Quick Trip', color: '#f59e0b' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setActiveType(type.id)}
                  className="mr-2"
                >
                  <LinearGradient
                    colors={
                      activeType === type.id
                        ? [type.color, type.color]
                        : ['#f3f4f6', '#f3f4f6']
                    }
                    className="rounded-2xl px-5 py-4 flex-row items-center shadow-lg"
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={22}
                      color={activeType === type.id ? '#fff' : '#6b7280'}
                    />
                    <Text
                      className={`ml-2 font-bold ${
                        activeType === type.id ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Budget Travel Form */}
        {activeType === 'budget' && (
          <View className="mx-6 mb-6 bg-white rounded-3xl p-6 shadow-lg border border-green-100">
            <View className="flex-row items-center mb-4">
              <View className="bg-green-100 rounded-full p-3 mr-3">
                <Ionicons name="cash" size={24} color="#10b981" />
              </View>
              <Text className="text-xl font-extrabold text-gray-900">Budget-Friendly Travel</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Budget Range</Text>
              <View className="flex-row gap-3">
                <TextInput
                  placeholder="Min (₹20000)"
                  keyboardType="numeric"
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
                  placeholderTextColor="#9ca3af"
                />
                <TextInput
                  placeholder="Max (₹50000)"
                  keyboardType="numeric"
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Number of Travelers</Text>
              <TextInput
                placeholder="2"
                keyboardType="numeric"
                value={numTravelers}
                onChangeText={setNumTravelers}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Submit Button - More Visible */}
            <TouchableOpacity
              onPress={getBudgetRecommendations}
              disabled={loading}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="search" size={22} color="#fff" />
                    <Text className="text-white font-extrabold text-center ml-2 text-lg">
                      Get AI Recommendations
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Multi-City Form */}
        {activeType === 'multi_city' && (
          <View className="mx-6 mb-6 bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
            <View className="flex-row items-center mb-4">
              <View className="bg-blue-100 rounded-full p-3 mr-3">
                <Ionicons name="map" size={24} color="#6366f1" />
              </View>
              <Text className="text-xl font-extrabold text-gray-900">Multi-City Adventure</Text>
            </View>

            {/* Cities List */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-700">Your Cities</Text>
                <Text className="text-xs text-blue-600">{cities.length} cities selected</Text>
              </View>

              {cities.map((city, index) => (
                <View key={index} className="bg-blue-50 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-blue-200">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-blue-600 font-bold mr-2">{index + 1}.</Text>
                    <TextInput
                      value={city}
                      onChangeText={(text) => {
                        const newCities = [...cities];
                        newCities[index] = text;
                        setCities(newCities);
                      }}
                      placeholder="City name"
                      className="flex-1 text-gray-900 font-semibold"
                    />
                  </View>
                  {cities.length > 2 && (
                    <TouchableOpacity
                      onPress={() => {
                        const newCities = cities.filter((_, i) => i !== index);
                        setCities(newCities);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add City Button */}
              <TouchableOpacity
                onPress={() => setCities([...cities, ''])}
                className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center justify-center mt-2"
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text className="text-white font-bold ml-2">Add Another City</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Total Budget (₹)</Text>
              <TextInput
                placeholder="50000"
                keyboardType="numeric"
                value={budgetMax}
                onChangeText={setBudgetMax}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-blue-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Total Days</Text>
              <TextInput
                placeholder="6"
                keyboardType="numeric"
                value={travelDays}
                onChangeText={setTravelDays}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-blue-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Number of Travelers</Text>
              <TextInput
                placeholder="2"
                keyboardType="numeric"
                value={numTravelers}
                onChangeText={setNumTravelers}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-blue-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Travel Preference</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {[
                    { id: 'cheapest' as const, label: 'Cheapest', color: '#10b981' },
                    { id: 'balanced' as const, label: 'Balanced', color: '#6366f1' },
                    { id: 'comfort' as const, label: 'Comfort', color: '#8b5cf6' },
                    { id: 'fastest' as const, label: 'Fastest', color: '#f59e0b' },
                  ].map((pref) => (
                    <TouchableOpacity
                      key={pref.id}
                      onPress={() => setPreference(pref.id)}
                    >
                      <LinearGradient
                        colors={preference === pref.id ? [pref.color, pref.color] : ['#f3f4f6', '#f3f4f6']}
                        className="px-5 py-3 rounded-xl shadow-sm"
                      >
                        <Text
                          className={`font-bold ${
                            preference === pref.id ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {pref.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Submit Button - More Visible */}
            <TouchableOpacity
              onPress={getMultiCityRecommendations}
              disabled={loading}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={22} color="#fff" />
                    <Text className="text-white font-extrabold text-center ml-2 text-lg">
                      Plan My Journey
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Trip Form */}
        {activeType === 'quick' && (
          <View className="mx-6 mb-6 bg-white rounded-3xl p-6 shadow-lg border border-orange-100">
            <View className="flex-row items-center mb-4">
              <View className="bg-orange-100 rounded-full p-3 mr-3">
                <Ionicons name="flash" size={24} color="#f59e0b" />
              </View>
              <Text className="text-xl font-extrabold text-gray-900">Quick Weekend Trip</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">From City</Text>
              <TextInput
                placeholder="Pune"
                value={fromCity}
                onChangeText={setFromCity}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-orange-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">To City</Text>
              <TextInput
                placeholder="Mumbai"
                value={toCity}
                onChangeText={setToCity}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-orange-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Budget (₹)</Text>
              <TextInput
                placeholder="15000"
                keyboardType="numeric"
                value={quickBudget}
                onChangeText={setQuickBudget}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-orange-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Number of Travelers</Text>
              <TextInput
                placeholder="2"
                keyboardType="numeric"
                value={numTravelers}
                onChangeText={setNumTravelers}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-orange-200 text-gray-900 font-bold"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Submit Button - More Visible */}
            <TouchableOpacity
              onPress={getQuickTripPlan}
              disabled={loading}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="flash" size={22} color="#fff" />
                    <Text className="text-white font-extrabold text-center ml-2 text-lg">
                      Plan Quick Trip
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        {travelPlan && (
          <View className="mx-6 mb-6">
            {/* New Search Button - More Visible */}
            <TouchableOpacity
              onPress={() => {
                setTravelPlan(null);
                setInsights(null);
                setActiveType(null);
              }}
              className="mb-6"
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-lg"
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text className="text-white font-extrabold ml-2 text-lg">Clear & Start New Search</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Summary Card - What You'll Pay */}
            <View className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-6 mb-6 shadow-2xl">
              <Text className="text-white text-sm font-semibold mb-2 opacity-90">
                YOUR TRIP SUMMARY
              </Text>
              <Text className="text-white text-3xl font-extrabold mb-4">
                {formatPrice(travelPlan.budget_breakdown.total_budget)}
              </Text>

              <View className="flex-row items-center mb-3">
                <View className="bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="calendar" size={20} color="#fff" />
                </View>
                <View>
                  <Text className="text-white/80 text-xs">Duration</Text>
                  <Text className="text-white font-bold text-base">
                    {travelPlan.total_duration_days} Days
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <View className="bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="people" size={20} color="#fff" />
                </View>
                <View>
                  <Text className="text-white/80 text-xs">Travelers</Text>
                  <Text className="text-white font-bold text-base">
                    {travelPlan.total_travelers} People
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white/80 text-xs">Cities</Text>
                  <Text className="text-white font-bold text-base">
                    {[...new Set(travelPlan.itinerary.map((leg: any) => leg.to_city))].join(' → ')}
                  </Text>
                </View>
              </View>

              <View className="mt-4 pt-4 border-t border-white/20">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white font-bold">Cost per Person</Text>
                  <Text className="text-white font-extrabold text-xl">
                    {formatPrice(travelPlan.budget_breakdown.cost_per_person)}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-2xl font-extrabold text-gray-900 mb-4">
              🎉 Your AI-Optimized Plan
            </Text>

            {/* Detailed Itinerary */}
            <View className="mb-4">
              <Text className="text-xl font-extrabold text-gray-900 mb-3">
                📍 Your Journey
              </Text>
              {travelPlan.itinerary?.map((leg: any, index: number) => (
                <View key={index} className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
                  {/* Leg Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="bg-blue-100 px-4 py-2 rounded-full">
                      <Text className="text-blue-800 font-extrabold">Day {leg.leg_number}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-700 font-bold">{leg.from_city}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#6b7280" className="mx-2" />
                      <Text className="text-gray-700 font-bold">{leg.to_city}</Text>
                    </View>
                  </View>

                  {/* Transport */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="airplane" size={20} color="#3b82f6" />
                      <Text className="ml-2 font-bold text-gray-800">Transport</Text>
                    </View>
                    <View className="bg-blue-50 p-4 rounded-2xl">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-700 font-semibold capitalize">
                          {leg.transport.mode}
                        </Text>
                        <Text className="text-blue-600 font-extrabold text-lg">
                          {formatPrice(leg.transport.cost_per_person)}
                        </Text>
                      </View>
                      <Text className="text-gray-600 text-sm">{leg.transport.provider}</Text>
                      {leg.transport.duration_minutes > 0 && (
                        <Text className="text-gray-500 text-xs mt-1">
                          Duration: {Math.floor(leg.transport.duration_minutes / 60)}h {leg.transport.duration_minutes % 60}m
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Accommodation */}
                  {leg.accommodation && (
                    <View className="mb-4">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="bed" size={20} color="#10b981" />
                        <Text className="ml-2 font-bold text-gray-800">Hotel</Text>
                      </View>
                      <View className="bg-green-50 p-4 rounded-2xl">
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-base">
                              {leg.accommodation.hotel_name}
                            </Text>
                            <Text className="text-gray-600 text-sm mt-1 capitalize">
                              {leg.accommodation.accommodation_type} • {leg.accommodation.nights} night(s)
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-green-600 font-extrabold text-lg">
                              {formatPrice(leg.accommodation.total_cost)}
                            </Text>
                            <Text className="text-gray-500 text-xs">
                              {formatPrice(leg.accommodation.cost_per_night)}/night
                            </Text>
                          </View>
                        </View>
                        {leg.accommodation.amenities && leg.accommodation.amenities.length > 0 && (
                          <View className="flex-row flex-wrap gap-2 mt-2">
                            {leg.accommodation.amenities.slice(0, 4).map((amenity: string, i: number) => (
                              <View key={i} className="bg-white px-3 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-semibold">{amenity}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Local Transport */}
                  {leg.local_transport && leg.local_transport.length > 0 && (
                    <View>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="car" size={20} color="#f59e0b" />
                        <Text className="ml-2 font-bold text-gray-800">Local Travel</Text>
                      </View>
                      {leg.local_transport.map((local: any, i: number) => (
                        <View key={i} className="bg-orange-50 p-3 rounded-2xl mb-2">
                          <View className="flex-row justify-between items-center">
                            <Text className="text-gray-700 text-sm flex-1">
                              {local.description}
                            </Text>
                            <Text className="text-orange-600 font-bold ml-2">
                              {formatPrice(local.cost)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Budget Summary */}
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-800 mb-3">Budget Breakdown</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600">Transport</Text>
                  <Text className="font-bold text-gray-900">
                    {formatPrice(travelPlan.budget_breakdown.transport_cost)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600">Accommodation</Text>
                  <Text className="font-bold text-gray-900">
                    {formatPrice(travelPlan.budget_breakdown.accommodation_cost)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600">Food</Text>
                  <Text className="font-bold text-gray-900">
                    {formatPrice(travelPlan.budget_breakdown.food_estimated)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600">Activities</Text>
                  <Text className="font-bold text-gray-900">
                    {formatPrice(travelPlan.budget_breakdown.activities_estimated)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-600">Buffer</Text>
                  <Text className="font-bold text-gray-900">
                    {formatPrice(travelPlan.budget_breakdown.buffer_amount)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-3 mt-2 bg-purple-50 px-3 rounded-xl">
                  <Text className="font-bold text-purple-900">Total Budget</Text>
                  <Text className="font-extrabold text-purple-900 text-lg">
                    {formatPrice(travelPlan.budget_breakdown.total_budget)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 mt-2 bg-green-50 px-3 rounded-xl">
                  <Text className="font-semibold text-green-900">Budget Used</Text>
                  <Text className="font-bold text-green-900">
                    {travelPlan.budget_breakdown.budget_utilization_percent.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* AI Insights */}
            {insights && (
              <View className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">
                  💡 AI Insights & Tips
                </Text>
                <Text className="text-gray-700 mb-4">{insights.trip_summary}</Text>

                {/* Insider Tips */}
                {insights.insider_tips && insights.insider_tips.length > 0 && (
                  <View className="mb-4">
                    <Text className="font-semibold text-gray-800 mb-2">✨ Insider Tips:</Text>
                    {insights.insider_tips.map((tip: string, index: number) => (
                      <View key={index} className="flex-row items-start mb-2">
                        <Text className="text-purple-600 mr-2">•</Text>
                        <Text className="flex-1 text-gray-600">{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Must-See Attractions */}
                {insights.must_see_attractions && insights.must_see_attractions.length > 0 && (
                  <View className="mb-4">
                    <Text className="font-semibold text-gray-800 mb-2">🏛️ Must-See:</Text>
                    {insights.must_see_attractions.map((place: string, index: number) => (
                      <View key={index} className="flex-row items-center mb-2">
                        <Ionicons name="location" size={16} color="#8b5cf6" />
                        <Text className="ml-2 text-gray-600">{place}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Food Recommendations */}
                {insights.food_recommendations && insights.food_recommendations.length > 0 && (
                  <View className="mb-4">
                    <Text className="font-semibold text-gray-800 mb-2">🍽️ Food to Try:</Text>
                    {insights.food_recommendations.map((food: string, index: number) => (
                      <View key={index} className="flex-row items-center mb-2">
                        <Ionicons name="restaurant" size={16} color="#ec4899" />
                        <Text className="ml-2 text-gray-600">{food}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Budget Insight */}
                {insights.budget_insight && (
                  <View className="bg-white p-3 rounded-xl mt-2">
                    <Text className="text-purple-900 font-semibold text-sm">
                      💰 {insights.budget_insight}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Reasoning */}
            <View className="bg-blue-50 rounded-3xl p-6">
              <Text className="text-lg font-bold text-gray-800 mb-2">
                🤖 AI Reasoning
              </Text>
              <Text className="text-gray-700">{travelPlan.reasoning}</Text>
              <View className="mt-4 flex-row items-center">
                <Text className="text-sm text-gray-600">Confidence:</Text>
                <Text className="ml-2 font-bold text-blue-600">
                  {(travelPlan.confidence_score * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

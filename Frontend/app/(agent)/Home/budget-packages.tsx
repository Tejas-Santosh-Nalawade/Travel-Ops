import React, { useState } from 'react'
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../../lib/supabase'

interface Package {
  package_id: string
  package_name: string
  destination: string
  price_per_person: number
  total_cost: number
  savings_percent: number
  match_score: number
  recommendation_reason: string
  duration_days: number
  included_items: string[]
  highlights: string[]
}

interface BudgetResponse {
  success: boolean
  packages: Package[]
  total_found: number
  budget_analysis: string
  ai_insights: string
  powered_by: string
}

export default function BudgetPackages() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [numTravelers, setNumTravelers] = useState('2')
  const [budgetAnalysis, setBudgetAnalysis] = useState('')
  const [aiInsights, setAiInsights] = useState('')
  const fadeAnim = useState(new Animated.Value(0))[0]

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  const searchPackages = async () => {
    if (!budgetMin || !budgetMax) {
      Alert.alert('Missing Information', 'Please enter your budget range')
      return
    }

    if (parseFloat(budgetMin) >= parseFloat(budgetMax)) {
      Alert.alert('Invalid Range', 'Minimum budget must be less than maximum budget')
      return
    }

    try {
      setLoading(true)
      setPackages([])
      setBudgetAnalysis('')
      setAiInsights('')

      // Use your machine's IP address for React Native
      const API_BASE_URL = 'http://10.243.165.242:8000'

      // Call AI-powered budget recommendations API
      const response = await fetch(`${API_BASE_URL}/api/v1/budget/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget_min: parseFloat(budgetMin),
          budget_max: parseFloat(budgetMax),
          num_travelers: parseInt(numTravelers) || 2,
          preferences: {},
          duration_days: 5
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data: BudgetResponse = await response.json()

      if (!data.success || !data.packages || data.packages.length === 0) {
        Alert.alert(
          'No Results',
          'No packages found in your budget range. Try adjusting your filters.'
        )
      } else {
        setPackages(data.packages)
        setBudgetAnalysis(data.budget_analysis)
        setAiInsights(data.ai_insights)

        Alert.alert(
          '✨ AI Recommendations Ready!',
          `Found ${data.total_found} amazing packages for you!\n\n${data.budget_analysis}`,
          [{ text: 'Explore', style: 'default' }]
        )
      }
    } catch (error: any) {
      console.error('Budget search error:', error)
      Alert.alert(
        'Error',
        'Failed to get recommendations. Please check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        className="px-5 py-6"
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white mb-1">
              💰 Budget Smart
            </Text>
            <Text className="text-sm text-blue-100">
              AI-powered package recommendations
            </Text>
          </View>
          <Ionicons name="wallet" size={32} color="#ffffff" />
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
          {/* Search Form */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Your Budget Details
            </Text>

            {/* Budget Range */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Budget Range (₹)
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                  <Text className="text-gray-500 mr-2">₹</Text>
                  <TextInput
                    placeholder="Min"
                    placeholderTextColor="#9ca3af"
                    value={budgetMin}
                    onChangeText={setBudgetMin}
                    keyboardType="numeric"
                    className="flex-1 text-gray-900"
                  />
                </View>
                <View className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                  <Text className="text-gray-500 mr-2">₹</Text>
                  <TextInput
                    placeholder="Max"
                    placeholderTextColor="#9ca3af"
                    value={budgetMax}
                    onChangeText={setBudgetMax}
                    keyboardType="numeric"
                    className="flex-1 text-gray-900"
                  />
                </View>
              </View>
            </View>

            {/* Number of Travelers */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Number of Travelers
              </Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                <Ionicons name="people" size={20} color="#6b7280" />
                <TextInput
                  placeholder="2"
                  placeholderTextColor="#9ca3af"
                  value={numTravelers}
                  onChangeText={setNumTravelers}
                  keyboardType="numeric"
                  className="flex-1 ml-3 text-gray-900"
                />
              </View>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              onPress={searchPackages}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9ca3af', '#6b7280'] : ['#3b82f6', '#2563eb']}
                className="rounded-xl py-4 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="search" size={20} color="#ffffff" />
                    <Text className="text-white font-bold text-base ml-2">
                      Find Packages
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* AI Insights Banner */}
          {aiInsights && (
            <View className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 mb-4 border border-purple-200">
              <View className="flex-row items-start">
                <View className="bg-purple-100 rounded-full p-2 mr-3">
                  <Ionicons name="bulb" size={20} color="#7c3aed" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-purple-900 mb-1">
                    💡 AI Travel Insight
                  </Text>
                  <Text className="text-sm text-purple-700">
                    {aiInsights}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Results */}
          {packages.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">
                  {packages.length} Packages Found
                </Text>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-green-700">
                    GREAT DEALS
                  </Text>
                </View>
              </View>

              <View className="gap-4">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.package_id} package={pkg} />
                ))}
              </View>
            </View>
          )}

          {/* Empty State (when searched but no results) */}
          {!loading && packages.length === 0 && budgetMin && budgetMax && (
            <View className="items-center py-10">
              <Ionicons name="sad-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4">
                No packages found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center px-8">
                Try adjusting your budget range or number of travelers
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

/* ================= COMPONENT ================= */

function PackageCard({ package: pkg }: { package: Package }) {
  const router = useRouter()

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {pkg.package_name}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {pkg.destination}
            </Text>
          </View>
        </View>
        
        {/* Match Score */}
        <View className="bg-blue-50 px-3 py-2 rounded-xl items-center">
          <Text className="text-2xl font-extrabold text-blue-600">
            {pkg.match_score}
          </Text>
          <Text className="text-xs text-blue-600 font-semibold">
            MATCH
          </Text>
        </View>
      </View>

      {/* Recommendation Reason */}
      <View className="bg-green-50 rounded-xl p-3 mb-3 border border-green-200">
        <View className="flex-row items-start">
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text className="flex-1 text-sm text-green-700 font-medium ml-2">
            {pkg.recommendation_reason}
          </Text>
        </View>
      </View>

      {/* Pricing */}
      <View className="flex-row items-end justify-between pt-3 border-t border-gray-100">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Total Cost</Text>
          <View className="flex-row items-baseline">
            <Text className="text-2xl font-extrabold text-gray-900">
              ₹{pkg.total_cost.toLocaleString('en-IN')}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-1">
            ₹{pkg.price_per_person.toLocaleString('en-IN')}/person
          </Text>
        </View>

        {/* Savings Badge */}
        {pkg.savings_percent > 0 && (
          <View className="bg-orange-100 px-3 py-2 rounded-lg">
            <Text className="text-xs font-bold text-orange-700">
              {pkg.savings_percent.toFixed(0)}% UNDER
            </Text>
            <Text className="text-xs font-bold text-orange-700">
              BUDGET
            </Text>
          </View>
        )}
      </View>

      {/* Book Button */}
      <TouchableOpacity
        onPress={() => {
          // Navigate to booking
          console.log('Book package:', pkg.package_id)
        }}
        className="mt-4 bg-blue-600 rounded-xl py-3 items-center"
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold">Book This Package</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

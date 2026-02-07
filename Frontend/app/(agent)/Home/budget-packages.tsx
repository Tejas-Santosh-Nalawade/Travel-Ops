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
}

export default function BudgetPackages() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [numTravelers, setNumTravelers] = useState('2')
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

      const { data: userData } = await supabase.auth.getUser()

      // Get or create customer
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single()

      if (!customer) {
        // Create customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: userData.user?.id,
            full_name: userData.user?.user_metadata?.full_name || 'Guest',
            email: userData.user?.email || 'guest@email.com'
          })
          .select('id')
          .single()

        if (customerError) throw customerError
        customer = newCustomer
      }

      const { data, error } = await supabase.rpc('get_budget_recommendations', {
        p_customer_id: customer?.id,
        p_budget_min: parseFloat(budgetMin),
        p_budget_max: parseFloat(budgetMax),
        p_num_travelers: parseInt(numTravelers) || 2,
        p_preferences: {}
      })

      if (error) throw error

      if (!data || data.length === 0) {
        Alert.alert('No Results', 'No packages found in your budget range. Try adjusting your filters.')
      } else {
        setPackages(data)
      }
    } catch (error: any) {
      console.error('Budget search error:', error)
      Alert.alert('Error', error.message || 'Failed to search packages. Please try again.')
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
              Budget Smart
            </Text>
            <Text className="text-sm text-blue-100">
              Find packages within your budget
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

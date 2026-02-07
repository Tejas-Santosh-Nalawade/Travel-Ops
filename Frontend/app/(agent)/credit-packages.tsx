import React, { useState } from 'react'
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'

interface Package {
  package_id: string
  package_name: string
  destination: string
  original_price: number
  discounted_price: number
  savings_amount: number
  cashback_amount: number
  reward_points: number
  card_offer: string
  recommendation_reason: string
}

export default function CreditCardPackages() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [cardType, setCardType] = useState('visa')
  const [cardTier, setCardTier] = useState('gold')
  const [spendingLimit, setSpendingLimit] = useState('')
  const fadeAnim = useState(new Animated.Value(0))[0]

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  const cardTypes = ['visa', 'mastercard', 'amex', 'rupay']
  const cardTiers = ['basic', 'silver', 'gold', 'platinum', 'signature']

  const searchPackages = async () => {
    if (!spendingLimit) {
      Alert.alert('Missing Information', 'Please enter your spending limit')
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

      const { data, error } = await supabase.rpc('get_credit_card_recommendations', {
        p_customer_id: customer?.id,
        p_card_type: cardType,
        p_card_tier: cardTier,
        p_spending_limit: parseFloat(spendingLimit)
      })

      if (error) throw error

      if (!data || data.length === 0) {
        Alert.alert('No Results', 'No packages with card offers found. Try different card details.')
      } else {
        setPackages(data)
      }
    } catch (error: any) {
      console.error('Credit card search error:', error)
      Alert.alert('Error', error.message || 'Failed to search packages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
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
              Credit Card Offers
            </Text>
            <Text className="text-sm text-amber-100">
              Exclusive deals & cashback
            </Text>
          </View>
          <Ionicons name="card" size={32} color="#ffffff" />
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
          {/* Search Form */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Your Card Details
            </Text>

            {/* Card Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Card Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {cardTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setCardType(type)}
                      className={`px-4 py-2 rounded-full border ${
                        cardType === type
                          ? 'bg-amber-600 border-amber-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          cardType === type ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Card Tier */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Card Tier
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {cardTiers.map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      onPress={() => setCardTier(tier)}
                      className={`px-4 py-2 rounded-full border ${
                        cardTier === tier
                          ? 'bg-amber-600 border-amber-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold capitalize ${
                          cardTier === tier ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {tier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Spending Limit */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Your Spending Limit (₹)
              </Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                <Text className="text-gray-500 mr-2">₹</Text>
                <TextInput
                  placeholder="50000"
                  placeholderTextColor="#9ca3af"
                  value={spendingLimit}
                  onChangeText={setSpendingLimit}
                  keyboardType="numeric"
                  className="flex-1 text-gray-900"
                />
              </View>
            </View>

            {/* Info */}
            <View className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={18} color="#f59e0b" />
                <Text className="flex-1 text-xs text-amber-700 ml-2">
                  We'll show packages with exclusive {cardType.toUpperCase()} {cardTier} offers, cashback deals, and reward points.
                </Text>
              </View>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              onPress={searchPackages}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9ca3af', '#6b7280'] : ['#f59e0b', '#d97706']}
                className="rounded-xl py-4 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="search" size={20} color="#ffffff" />
                    <Text className="text-white font-bold text-base ml-2">
                      Find Offers
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
                  {packages.length} Exclusive Offers
                </Text>
                <View className="bg-amber-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-amber-700">
                    BEST DEALS
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

          {/* Empty State */}
          {!loading && packages.length === 0 && spendingLimit && (
            <View className="items-center py-10">
              <Ionicons name="card-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4">
                No offers found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center px-8">
                Try different card details or increase your spending limit
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
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    >
      {/* Offer Badge */}
      <View className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2">
        <Text className="text-white font-bold text-sm">
          {pkg.card_offer || 'EXCLUSIVE CARD OFFER'}
        </Text>
      </View>

      <View className="p-5">
        {/* Header */}
        <View className="mb-3">
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

        {/* Benefits Grid */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {pkg.cashback_amount > 0 && (
            <View className="bg-green-50 px-3 py-1 rounded-lg flex-row items-center">
              <Ionicons name="cash" size={14} color="#10b981" />
              <Text className="text-xs font-bold text-green-700 ml-1">
                ₹{pkg.cashback_amount} Cashback
              </Text>
            </View>
          )}
          {pkg.reward_points > 0 && (
            <View className="bg-purple-50 px-3 py-1 rounded-lg flex-row items-center">
              <Ionicons name="star" size={14} color="#8b5cf6" />
              <Text className="text-xs font-bold text-purple-700 ml-1">
                {pkg.reward_points} Points
              </Text>
            </View>
          )}
          {pkg.savings_amount > 0 && (
            <View className="bg-orange-50 px-3 py-1 rounded-lg flex-row items-center">
              <Ionicons name="trending-down" size={14} color="#f59e0b" />
              <Text className="text-xs font-bold text-orange-700 ml-1">
                Save ₹{pkg.savings_amount}
              </Text>
            </View>
          )}
        </View>

        {/* Recommendation */}
        <View className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-200">
          <Text className="text-sm text-amber-800 font-medium">
            {pkg.recommendation_reason}
          </Text>
        </View>

        {/* Pricing */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View>
            <Text className="text-xs text-gray-500 line-through mb-1">
              ₹{pkg.original_price?.toLocaleString('en-IN') || '0'}
            </Text>
            <Text className="text-2xl font-extrabold text-gray-900">
              ₹{pkg.discounted_price?.toLocaleString('en-IN') || '0'}
            </Text>
          </View>

          <TouchableOpacity
            className="bg-amber-600 rounded-xl px-6 py-3"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

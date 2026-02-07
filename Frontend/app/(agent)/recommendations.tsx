import React, { useState, useEffect } from 'react'
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'

type RecommendationType = 'budget' | 'trend' | 'credit'

interface Recommendation {
  package_id: string
  package_name: string
  destination: string
  price_per_person?: number
  total_cost?: number
  savings_percent?: number
  match_score?: number
  recommendation_reason: string
  discounted_price?: number
  savings_amount?: number
  cashback_amount?: number
  reward_points?: number
  card_offer?: string
  trend_score?: number
  social_engagement?: number
}

export default function Recommendations() {
  const router = useRouter()
  const [activeType, setActiveType] = useState<RecommendationType | null>(null)
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]

  // Budget form
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [numTravelers, setNumTravelers] = useState('2')

  // Trend form
  const [trendUrl, setTrendUrl] = useState('')
  const [trendType, setTrendType] = useState<'instagram' | 'youtube'>('instagram')

  // Credit card form
  const [cardType, setCardType] = useState('visa')
  const [cardTier, setCardTier] = useState('gold')
  const [spendingLimit, setSpendingLimit] = useState('')

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getBudgetRecommendations = async () => {
    if (!budgetMin || !budgetMax) {
      Alert.alert('Missing Information', 'Please enter your budget range')
      return
    }

    try {
      setLoading(true)
      setRecommendations([])
      
      const { data: userData } = await supabase.auth.getUser()
      
      // Get or create customer
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single()

      if (!customer) {
        const { data: newCustomer } = await supabase.rpc('register_customer', {
          p_user_id: userData.user?.id,
          p_full_name: userData.user?.user_metadata?.full_name || 'Guest',
          p_email: userData.user?.email || 'guest@email.com'
        })
        customer = { id: newCustomer }
      }

      const { data, error } = await supabase.rpc('get_budget_recommendations', {
        p_customer_id: customer?.id,
        p_budget_min: parseFloat(budgetMin),
        p_budget_max: parseFloat(budgetMax),
        p_num_travelers: parseInt(numTravelers) || 2
      })

      if (error) throw error
      setRecommendations(data || [])
      
      if (data?.length === 0) {
        Alert.alert('No Results', 'No packages found in your budget range. Try adjusting your filters.')
      }
    } catch (error: any) {
      console.error('Budget recommendations error:', error)
      Alert.alert('Error', 'Failed to get recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTrendRecommendations = async () => {
    if (!trendUrl) {
      Alert.alert('Missing Information', 'Please enter a social media URL')
      return
    }

    try {
      setLoading(true)
      setRecommendations([])
      
      const { data: userData } = await supabase.auth.getUser()
      
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single()

      if (!customer) {
        const { data: newCustomer } = await supabase.rpc('register_customer', {
          p_user_id: userData.user?.id,
          p_full_name: userData.user?.user_metadata?.full_name || 'Guest',
          p_email: userData.user?.email || 'guest@email.com'
        })
        customer = { id: newCustomer }
      }

      // Extract destination from URL (simplified)
      const extractedData = {
        destinations: ['Paris', 'Dubai', 'Bali', 'Tokyo', 'Maldives'],
        activities: ['beach', 'adventure', 'cultural', 'luxury', 'romantic']
      }

      const { data, error } = await supabase.rpc('get_trend_recommendations', {
        p_customer_id: customer?.id,
        p_source_type: trendType,
        p_source_url: trendUrl,
        p_extracted_data: extractedData
      })

      if (error) throw error
      setRecommendations(data || [])
      
      if (data?.length === 0) {
        Alert.alert('No Results', 'No trending packages found. Try a different URL.')
      }
    } catch (error: any) {
      console.error('Trend recommendations error:', error)
      Alert.alert('Error', 'Failed to analyze trends. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCreditCardRecommendations = async () => {
    if (!spendingLimit) {
      Alert.alert('Missing Information', 'Please enter your spending limit')
      return
    }

    try {
      setLoading(true)
      setRecommendations([])
      
      const { data: userData } = await supabase.auth.getUser()
      
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single()

      if (!customer) {
        const { data: newCustomer } = await supabase.rpc('register_customer', {
          p_user_id: userData.user?.id,
          p_full_name: userData.user?.user_metadata?.full_name || 'Guest',
          p_email: userData.user?.email || 'guest@email.com'
        })
        customer = { id: newCustomer }
      }

      const { data, error } = await supabase.rpc('get_credit_card_recommendations', {
        p_customer_id: customer?.id,
        p_card_type: cardType,
        p_card_tier: cardTier,
        p_spending_limit: parseFloat(spendingLimit)
      })

      if (error) throw error
      setRecommendations(data || [])
      
      if (data?.length === 0) {
        Alert.alert('No Results', 'No offers found for your card. Try increasing your spending limit.')
      }
    } catch (error: any) {
      console.error('Credit card recommendations error:', error)
      Alert.alert('Error', 'Failed to get card offers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`

  const renderChoiceCards = () => (
    <Animated.View 
      style={{ 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
      className="space-y-4"
    >
      {/* Budget Card */}
      <TouchableOpacity
        onPress={() => setActiveType('budget')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6 rounded-3xl shadow-2xl mb-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                <Ionicons name="wallet" size={28} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-2xl mb-1">
                  Budget-Based
                </Text>
                <Text className="text-blue-100 text-sm">
                  Perfect packages for your budget
                </Text>
              </View>
            </View>
            <View className="bg-white/20 rounded-full p-2">
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </View>
          
          <View className="flex-row items-center bg-white/10 rounded-xl p-3">
            <Ionicons name="checkmark-circle" size={20} color="#93c5fd" />
            <Text className="text-blue-50 ml-2 text-sm">
              Get max value within your spending limit
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Trend Card */}
      <TouchableOpacity
        onPress={() => setActiveType('trend')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#f97316', '#fb923c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6 rounded-3xl shadow-2xl mb-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                <Ionicons name="trending-up" size={28} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-2xl mb-1">
                  Trend-Based
                </Text>
                <Text className="text-orange-100 text-sm">
                  Viral destinations from social media
                </Text>
              </View>
            </View>
            <View className="bg-white/20 rounded-full p-2">
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </View>
          
          <View className="flex-row gap-2">
            <View className="flex-1 bg-white/10  rounded-xl p-2 flex-row items-center justify-center">
              <Ionicons name="logo-instagram" size={16} color="#fbbf24" />
              <Text className="text-orange-50 ml-2 text-xs font-semibold">Instagram</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-2 flex-row items-center justify-center">
              <Ionicons name="logo-youtube" size={16} color="#fbbf24" />
              <Text className="text-orange-50 ml-2 text-xs font-semibold">YouTube</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Credit Card */}
      <TouchableOpacity
        onPress={() => setActiveType('credit')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6 rounded-3xl shadow-2xl"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                <Ionicons name="card" size={28} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-2xl mb-1">
                  Card Offers
                </Text>
                <Text className="text-green-100 text-sm">
                  Exclusive discounts & cashback
                </Text>
              </View>
            </View>
            <View className="bg-white/20 rounded-full p-2">
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </View>
          
          <View className="flex-row items-center bg-white/10 rounded-xl p-3">
            <MaterialCommunityIcons name="sale" size={20} color="#86efac" />
            <Text className="text-green-50 ml-2 text-sm">
              Save up to 15% + earn reward points
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )

  const renderBudgetForm = () => (
    <View className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100">
      <View className="flex-row items-center mb-5">
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
        >
          <Ionicons name="wallet" size={24} color="#fff" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-gray-900">Budget Calculator</Text>
          <Text className="text-sm text-gray-500">Find packages in your range</Text>
        </View>
      </View>

      <View className="bg-blue-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-blue-900 mb-3">💰 Your Budget</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs text-blue-700 mb-2 font-semibold">Minimum (₹)</Text>
            <TextInput
              placeholder="30,000"
              keyboardType="numeric"
              value={budgetMin}
              onChangeText={setBudgetMin}
              className="bg-white rounded-xl px-4 py-3 border-2 border-blue-200 text-gray-900 font-bold"
              placeholderTextColor="#93c5fd"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-blue-700 mb-2 font-semibold">Maximum (₹)</Text>
            <TextInput
              placeholder="100,000"
              keyboardType="numeric"
              value={budgetMax}
              onChangeText={setBudgetMax}
              className="bg-white rounded-xl px-4 py-3 border-2 border-blue-200 text-gray-900 font-bold"
              placeholderTextColor="#93c5fd"
            />
          </View>
        </View>
      </View>

      <View className="bg-blue-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-blue-900 mb-3">👥 Number of Travelers</Text>
        <View className="flex-row gap-2">
          {['1', '2', '3', '4', '5+'].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => setNumTravelers(num === '5+' ? '5' : num)}
              className={`flex-1 py-3 rounded-xl ${
                numTravelers === (num === '5+' ? '5' : num)
                  ? 'bg-blue-600'
                  : 'bg-white border-2 border-blue-200'
              }`}
            >
              <Text className={`text-center font-extrabold ${
                numTravelers === (num === '5+' ? '5' : num) ? 'text-white' : 'text-blue-600'
              }`}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={getBudgetRecommendations}
        disabled={loading}
      >
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text className="text-white font-extrabold ml-2 text-base">
                Find Perfect Packages
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderTrendForm = () => (
    <View className="bg-white p-6 rounded-3xl shadow-xl border border-orange-100">
      <View className="flex-row items-center mb-5">
        <LinearGradient
          colors={['#f97316', '#fb923c']}
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
        >
          <Ionicons name="trending-up" size={24} color="#fff" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-gray-900">Trend Analyzer</Text>
          <Text className="text-sm text-gray-500">Discover viral destinations</Text>
        </View>
      </View>

      <View className="bg-orange-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-orange-900 mb-3">📱 Choose Platform</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setTrendType('instagram')}
            className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${
              trendType === 'instagram' ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-white border-2 border-orange-200'
            }`}
          >
            <Ionicons name="logo-instagram" size={20} color={trendType === 'instagram' ? 'white' : '#f97316'} />
            <Text className={`ml-2 font-extrabold ${trendType === 'instagram' ? 'text-white' : 'text-orange-600'}`}>
              Instagram
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTrendType('youtube')}
            className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${
              trendType === 'youtube' ? 'bg-red-600' : 'bg-white border-2 border-orange-200'
            }`}
          >
            <Ionicons name="logo-youtube" size={20} color={trendType === 'youtube' ? 'white' : '#f97316'} />
            <Text className={`ml-2 font-extrabold ${trendType === 'youtube' ? 'text-white' : 'text-orange-600'}`}>
              YouTube
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-orange-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-orange-900 mb-3">🔗 Paste URL</Text>
        <TextInput
          placeholder={`Paste ${trendType === 'instagram' ? 'Instagram' : 'YouTube'} travel post URL...`}
          value={trendUrl}
          onChangeText={setTrendUrl}
          className="bg-white rounded-xl px-4 py-3 border-2 border-orange-200 text-gray-900"
          autoCapitalize="none"
          placeholderTextColor="#fdba74"
        />
        <Text className="text-xs text-orange-600 mt-2">
          💡 Example: https://instagram.com/p/travel-post
        </Text>
      </View>

      <TouchableOpacity
        onPress={getTrendRecommendations}
        disabled={loading}
      >
        <LinearGradient
          colors={['#f97316', '#fb923c']}
          className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text className="text-white font-extrabold ml-2 text-base">
                Analyze & Recommend
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderCreditCardForm = () => (
    <View className="bg-white p-6 rounded-3xl shadow-xl border border-green-100">
      <View className="flex-row items-center mb-5">
        <LinearGradient
          colors={['#10b981', '#059669']}
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
        >
          <Ionicons name="card" size={24} color="#fff" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-gray-900">Card Benefits</Text>
          <Text className="text-sm text-gray-500">Maximize your savings</Text>
        </View>
      </View>

      <View className="bg-green-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-green-900 mb-3">💳 Select Card Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { id: 'visa', icon: 'card', color: '#1434CB' },
              { id: 'mastercard', icon: 'card-outline', color: '#EB001B' },
              { id: 'amex', icon: 'shield-checkmark', color: '#006FCF' },
              { id: 'rupay', icon: 'wallet', color: '#097939' }
            ].map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => setCardType(card.id)}
                className={`px-5 py-3 rounded-xl ${
                  cardType === card.id ? 'bg-green-600' : 'bg-white border-2 border-green-200'
                }`}
              >
                <Text className={`font-extrabold capitalize ${
                  cardType === card.id ? 'text-white' : 'text-green-700'
                }`}>
                  {card.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="bg-green-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-green-900 mb-3">⭐ Card Tier</Text>
        <View className="flex-row gap-2">
          {[
            { id: 'basic', icon: 'bronze' },
            { id: 'silver', icon: 'silver' },
            { id: 'gold', icon: 'gold' },
            { id: 'platinum', icon: 'diamond' }
          ].map((tier) => (
            <TouchableOpacity
              key={tier.id}
              onPress={() => setCardTier(tier.id)}
              className={`flex-1 py-3 rounded-xl ${
                cardTier === tier.id ? 'bg-green-600' : 'bg-white border-2 border-green-200'
              }`}
            >
              <Text className={`text-center font-extrabold capitalize text-xs ${
                cardTier === tier.id ? 'text-white' : 'text-green-700'
              }`}>
                {tier.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="bg-green-50 rounded-2xl p-4 mb-5">
        <Text className="font-semibold text-green-900 mb-3">💰 Spending Limit (₹)</Text>
        <TextInput
          placeholder="150,000"
          keyboardType="numeric"
          value={spendingLimit}
          onChangeText={setSpendingLimit}
          className="bg-white rounded-xl px-4 py-3 border-2 border-green-200 text-gray-900 font-bold"
          placeholderTextColor="#86efac"
        />
      </View>

      <TouchableOpacity
        onPress={getCreditCardRecommendations}
        disabled={loading}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="sale" size={20} color="#fff" />
              <Text className="text-white font-extrabold ml-2 text-base">
                Find Best Offers
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 py-5"
      >
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => activeType ? setActiveType(null) : router.back()} 
            className="mr-4 bg-white/20 rounded-full p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Smart Recommendations
            </Text>
            <Text className="text-purple-100 text-sm">
              {activeType ? 'Fill the form below' : 'Choose your preferred method'}
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-2">
            <Ionicons name="sparkles" size={24} color="#fbbf24" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-4 pt-6" 
        showsVerticalScrollIndicator={false}
      >
        {!activeType && renderChoiceCards()}
        {activeType === 'budget' && renderBudgetForm()}
        {activeType === 'trend' && renderTrendForm()}
        {activeType === 'credit' && renderCreditCardForm()}

        {/* Results */}
        {recommendations.length > 0 && (
          <View className="mt-6 mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-extrabold text-gray-900">
                ✨ {recommendations.length} Perfect Matches
              </Text>
            </View>

            {recommendations.map((rec, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white rounded-3xl mb-4 overflow-hidden shadow-xl border border-gray-100"
                activeOpacity={0.9}
              >
                {/* Gradient Header */}
                <LinearGradient
                  colors={
                    activeType === 'budget' ? ['#3b82f6', '#2563eb'] :
                    activeType === 'trend' ? ['#f97316', '#fb923c'] :
                    ['#10b981', '#059669']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-2xl font-extrabold text-white mb-2">
                        {rec.package_name}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="location" size={16} color="#fff" />
                        <Text className="text-white/90 ml-1 font-semibold">
                          {rec.destination}
                        </Text>
                      </View>
                    </View>
                    
                    {activeType === 'budget' && rec.match_score && (
                      <View className="bg-white/20 rounded-2xl px-4 py-2">
                        <Text className="text-white text-xs font-bold">MATCH</Text>
                        <Text className="text-white text-2xl font-extrabold text-center">
                          {rec.match_score}
                        </Text>
                        <Text className="text-white/90 text-xs font-semibold text-center">/100</Text>
                      </View>
                    )}

                    {activeType === 'trend' && rec.trend_score && (
                      <View className="bg-yellow-400 rounded-2xl px-3 py-2 flex-row items-center">
                        <Ionicons name="flame" size={20} color="#dc2626" />
                        <Text className="text-red-600 text-lg font-extrabold ml-1">
                          {rec.trend_score}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>

                {/* Content */}
                <View className="p-5">
                  {/* Recommendation Reason */}
                  <View className={`${
                    activeType === 'budget' ? 'bg-blue-50' :
                    activeType === 'trend' ? 'bg-orange-50' :
                    'bg-green-50'
                  } p-4 rounded-2xl mb-4`}>
                    <View className="flex-row items-start">
                      <Ionicons 
                        name="information-circle" 
                        size={20} 
                        color={
                          activeType === 'budget' ? '#3b82f6' :
                          activeType === 'trend' ? '#f97316' :
                          '#10b981'
                        }
                      />
                      <Text className={`flex-1 ml-2 font-semibold ${
                        activeType === 'budget' ? 'text-blue-900' :
                        activeType === 'trend' ? 'text-orange-900' :
                        'text-green-900'
                      }`}>
                        {rec.recommendation_reason}
                      </Text>
                    </View>
                  </View>

                  {/* Credit Card Benefits */}
                  {activeType === 'credit' && rec.card_offer && (
                    <View className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-2xl mb-4">
                      <Text className="text-green-900 font-extrabold text-base mb-2">
                        {rec.card_offer}
                      </Text>
                      <View className="flex-row gap-3">
                        {rec.cashback_amount && (
                          <View className="flex-1 bg-white rounded-xl p-2">
                            <Text className="text-green-600 text-xs font-bold">Cashback</Text>
                            <Text className="text-green-900 font-extrabold">
                              {formatPrice(rec.cashback_amount)}
                            </Text>
                          </View>
                        )}
                        {rec.reward_points && (
                          <View className="flex-1 bg-white rounded-xl p-2">
                            <Text className="text-green-600 text-xs font-bold">Rewards</Text>
                            <Text className="text-green-900 font-extrabold">
                              {rec.reward_points} pts
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Price */}
                  <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
                    <View>
                      {rec.discounted_price ? (
                        <>
                          <Text className="text-sm text-gray-500 line-through">
                            {formatPrice(rec.price_per_person || 0)}
                          </Text>
                          <Text className="text-3xl font-extrabold text-green-600">
                            {formatPrice(rec.discounted_price)}
                          </Text>
                          {rec.savings_amount && (
                            <Text className="text-xs text-green-600 font-bold">
                              Save {formatPrice(rec.savings_amount)}
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          <Text className="text-sm text-gray-500">Starting from</Text>
                          <Text className={`text-3xl font-extrabold ${
                            activeType === 'budget' ? 'text-blue-600' :
                            activeType === 'trend' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {formatPrice(rec.price_per_person || rec.total_cost || 0)}
                          </Text>
                        </>
                      )}
                    </View>
                    
                    <TouchableOpacity>
                      <LinearGradient
                        colors={
                          activeType === 'budget' ? ['#3b82f6', '#2563eb'] :
                          activeType === 'trend' ? ['#f97316', '#fb923c'] :
                          ['#10b981', '#059669']
                        }
                        className="rounded-2xl px-6 py-3 flex-row items-center shadow-lg"
                      >
                        <Text className="text-white font-extrabold mr-2">Book Now</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeType && recommendations.length === 0 && !loading && (
          <View className="bg-white p-10 rounded-3xl items-center mt-6 mb-8">
            <Ionicons name="search-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-base text-center font-semibold">
              Fill the form above to discover{'\n'}personalized recommendations
            </Text>
          </View>
        )}

        {loading && (
          <View className="bg-white p-12 rounded-3xl items-center mt-6 mb-8">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-gray-600 mt-4 font-semibold">
              Finding perfect packages...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

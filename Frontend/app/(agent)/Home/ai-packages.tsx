import React, { useState } from 'react'
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../../lib/supabase'

interface Package {
  package_id: string
  package_name: string
  destination: string
  price_per_person: number
  trend_score: number
  social_engagement: number
  recommendation_reason: string
}

export default function AIPackages() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [sourceType, setSourceType] = useState<'instagram' | 'youtube'>('instagram')
  const [contentUrl, setContentUrl] = useState('')
  const fadeAnim = useState(new Animated.Value(0))[0]

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  const searchPackages = async () => {
    if (!contentUrl.trim()) {
      Alert.alert('Missing Information', 'Please enter a social media URL')
      return
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\//
    if (!urlPattern.test(contentUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://')
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

      // AI extraction simulation (in production, this would call an AI service)
      const extractedData = {
        destinations: ['Dubai', 'Maldives', 'Bali', 'Paris', 'Tokyo', 'Switzerland'],
        activities: ['beach', 'adventure', 'luxury', 'romantic', 'cultural', 'wildlife']
      }

      const { data, error } = await supabase.rpc('get_trend_recommendations', {
        p_customer_id: customer?.id,
        p_source_type: sourceType,
        p_source_url: contentUrl,
        p_extracted_data: extractedData
      })

      if (error) throw error

      if (!data || data.length === 0) {
        Alert.alert('No Results', 'No trending packages found. Try a different URL or source.')
      } else {
        setPackages(data)
      }
    } catch (error: any) {
      console.error('AI search error:', error)
      Alert.alert('Error', error.message || 'Failed to analyze content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
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
              AI Trend Search
            </Text>
            <Text className="text-sm text-purple-100">
              Powered by social insights
            </Text>
          </View>
          <Ionicons name="sparkles" size={32} color="#ffffff" />
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
          {/* Search Form */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Analyze Content
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Our AI will analyze the content and suggest trending destinations
            </Text>

            {/* Source Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Content Source
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setSourceType('instagram')}
                  className={`flex-1 rounded-xl border-2 p-4 ${
                    sourceType === 'instagram'
                      ? 'bg-purple-50 border-purple-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="items-center">
                    <Ionicons 
                      name="logo-instagram" 
                      size={32} 
                      color={sourceType === 'instagram' ? '#8b5cf6' : '#9ca3af'} 
                    />
                    <Text 
                      className={`text-sm font-semibold mt-2 ${
                        sourceType === 'instagram' ? 'text-purple-700' : 'text-gray-600'
                      }`}
                    >
                      Instagram
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSourceType('youtube')}
                  className={`flex-1 rounded-xl border-2 p-4 ${
                    sourceType === 'youtube'
                      ? 'bg-red-50 border-red-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="items-center">
                    <Ionicons 
                      name="logo-youtube" 
                      size={32} 
                      color={sourceType === 'youtube' ? '#dc2626' : '#9ca3af'} 
                    />
                    <Text 
                      className={`text-sm font-semibold mt-2 ${
                        sourceType === 'youtube' ? 'text-red-700' : 'text-gray-600'
                      }`}
                    >
                      YouTube
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* URL Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                {sourceType === 'instagram' ? 'Instagram Post/Reel URL' : 'YouTube Video URL'}
              </Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
                <Ionicons 
                  name={sourceType === 'instagram' ? 'logo-instagram' : 'logo-youtube'} 
                  size={20} 
                  color={sourceType === 'instagram' ? '#e91e63' : '#dc2626'} 
                />
                <TextInput
                  placeholder={
                    sourceType === 'instagram' 
                      ? 'https://instagram.com/p/...' 
                      : 'https://youtube.com/watch?v=...'
                  }
                  placeholderTextColor="#9ca3af"
                  value={contentUrl}
                  onChangeText={setContentUrl}
                  className="flex-1 ml-3 text-gray-900"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Info */}
            <View className="bg-purple-50 rounded-xl p-3 mb-4 border border-purple-200">
              <View className="flex-row items-start">
                <Ionicons name="bulb" size={18} color="#8b5cf6" />
                <Text className="flex-1 text-xs text-purple-700 ml-2">
                  Our AI analyzes destinations, hashtags, and engagement to find trending packages that match the content vibe.
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
                colors={loading ? ['#9ca3af', '#6b7280'] : ['#8b5cf6', '#7c3aed']}
                className="rounded-xl py-4 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="sparkles" size={20} color="#ffffff" />
                    <Text className="text-white font-bold text-base ml-2">
                      Analyze with AI
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
                  {packages.length} Trending Packages
                </Text>
                <View className="bg-purple-100 px-3 py-1 rounded-full flex-row items-center">
                  <Ionicons name="flame" size={14} color="#8b5cf6" />
                  <Text className="text-xs font-bold text-purple-700 ml-1">
                    VIRAL
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
          {!loading && packages.length === 0 && contentUrl && (
            <View className="items-center py-10">
              <Ionicons name="search-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4">
                No trends found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center px-8">
                Try a different URL or switch between Instagram and YouTube
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
      {/* Trend Badge */}
      <View className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="flame" size={16} color="#ffffff" />
          <Text className="text-white font-bold text-sm ml-2">
            TRENDING NOW
          </Text>
        </View>
        <View className="bg-white/20 px-3 py-1 rounded-full">
          <Text className="text-white font-bold text-xs">
            Score: {pkg.trend_score}/100
          </Text>
        </View>
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

        {/* Engagement */}
        <View className="bg-purple-50 rounded-xl p-3 mb-3 border border-purple-200 flex-row items-center">
          <Ionicons name="heart" size={18} color="#8b5cf6" />
          <Text className="text-sm font-semibold text-purple-700 ml-2">
            {pkg.social_engagement?.toLocaleString() || '0'} Social Engagements
          </Text>
        </View>

        {/* Recommendation */}
        <View className="bg-gray-50 rounded-xl p-3 mb-4">
          <Text className="text-sm text-gray-700 font-medium">
            {pkg.recommendation_reason}
          </Text>
        </View>

        {/* Pricing & CTA */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View>
            <Text className="text-xs text-gray-500 mb-1">Starting from</Text>
            <Text className="text-2xl font-extrabold text-gray-900">
              ₹{pkg.price_per_person?.toLocaleString('en-IN') || '0'}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">/person</Text>
          </View>

          <TouchableOpacity
            className="bg-purple-600 rounded-xl px-6 py-3"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

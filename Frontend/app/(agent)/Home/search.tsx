import React, { useState, useEffect } from 'react'
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../../lib/supabase'

interface Package {
  id: string
  package_code: string
  name: string
  destination_name: string
  duration_days: number
  duration_nights: number
  description: string
  price_per_person: number
  package_type: string
  is_trending: boolean
  images: string[]
  tags: string[]
}

export default function PackageSearch() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const fadeAnim = useState(new Animated.Value(0))[0]
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    packageType: 'all'
  })

  useEffect(() => {
    // Auto-search on mount to show initial results
    searchPackages()

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  const searchPackages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('search_packages', {
        p_query: searchQuery || null,
        p_min_price: filters.minPrice ? parseFloat(filters.minPrice) : 0,
        p_max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : 999999,
        p_package_type: filters.packageType === 'all' ? null : filters.packageType,
        p_limit: 20
      })

      if (error) throw error
      setPackages(data || [])
    } catch (error: any) {
      console.error('Search error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    searchPackages()
  }

  const navigateToRecommendations = () => {
    router.push('/recommendations' as any)
  }

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getPackageTypeIcon = (type: string) => {
    switch (type) {
      case 'luxury': return 'diamond'
      case 'adventure': return 'hiking'
      case 'honeymoon': return 'heart'
      case 'family': return 'account-group'
      case 'beach': return 'beach'
      case 'budget': return 'currency-usd'
      default: return 'airplane'
    }
  }

  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case 'luxury': return '#8b5cf6'
      case 'adventure': return '#f97316'
      case 'honeymoon': return '#ec4899'
      case 'family': return '#10b981'
      case 'beach': return '#3b82f6'
      case 'budget': return '#6366f1'
      default: return '#6b7280'
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Gradient Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 py-6 pb-8"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white mb-1">
              Discover Packages
            </Text>
            <Text className="text-purple-100 text-sm">
              {packages.length} amazing journeys await
            </Text>
          </View>
          <TouchableOpacity
            onPress={navigateToRecommendations}
            className="bg-white/20 backdrop-blur-xl rounded-full p-3"
          >
            <Ionicons name="sparkles" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white/90 backdrop-blur-md rounded-2xl flex-row items-center px-5 py-4 shadow-lg">
          <Ionicons name="search" size={22} color="#6366f1" />
          <TextInput
            placeholder="Search destinations, experiences..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            className="flex-1 ml-3 text-base text-gray-900 font-medium"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle Button */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 mt-3 flex-row items-center justify-center"
        >
          <Ionicons name="options" size={20} color="#fff" />
          <Text className="text-white font-semibold ml-2">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <Animated.ScrollView
        className="flex-1"
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters Panel */}
        {showFilters && (
          <View className="bg-white m-4 p-5 rounded-2xl shadow-md border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Refine Your Search
            </Text>

            {/* Price Range */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                💰 Budget Range
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Minimum</Text>
                  <TextInput
                    placeholder="₹ 0"
                    keyboardType="numeric"
                    value={filters.minPrice}
                    onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-900 font-semibold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Maximum</Text>
                  <TextInput
                    placeholder="₹ ∞"
                    keyboardType="numeric"
                    value={filters.maxPrice}
                    onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-900 font-semibold"
                  />
                </View>
              </View>
            </View>

            {/* Package Type Filter */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                🎯 Package Style
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {[
                    { id: 'all', label: 'All', icon: 'grid' },
                    { id: 'budget', label: 'Budget', icon: 'cash' },
                    { id: 'luxury', label: 'Luxury', icon: 'diamond' },
                    { id: 'adventure', label: 'Adventure', icon: 'fitness' },
                    { id: 'honeymoon', label: 'Honeymoon', icon: 'heart' },
                    { id: 'family', label: 'Family', icon: 'people' },
                    { id: 'beach', label: 'Beach', icon: 'water' }
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setFilters({ ...filters, packageType: type.id })}
                      className={`px-5 py-3 rounded-xl flex-row items-center ${filters.packageType === type.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                          : 'bg-gray-100'
                        }`}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={16}
                        color={filters.packageType === type.id ? '#fff' : '#6b7280'}
                      />
                      <Text className={`ml-2 font-bold capitalize ${filters.packageType === type.id ? 'text-white' : 'text-gray-700'
                        }`}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={handleSearch}
              className="mt-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl py-4 flex-row items-center justify-center shadow-lg"
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text className="text-white font-bold ml-2 text-base">
                Apply Filters & Search
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Smart Recommendations Banner */}
        <TouchableOpacity
          onPress={navigateToRecommendations}
          className="mx-4 mb-4"
        >
          <LinearGradient
            colors={['#f97316', '#fb923c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-5 flex-row items-center shadow-lg"
          >
            <View className="bg-white/20 rounded-full p-3 mr-4">
              <Ionicons name="sparkles" size={28} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-extrabold text-lg mb-1">
                Get Smart Recommendations
              </Text>
              <Text className="text-orange-100 text-sm">
                AI-powered picks based on your budget & trends
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Loading State */}
        {loading && (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-gray-500 mt-4 font-medium">
              Searching amazing packages...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && packages.length === 0 && (
          <View className="py-16 px-6 items-center">
            <View className="bg-purple-100 rounded-full p-6 mb-4">
              <Ionicons name="search-outline" size={48} color="#6366f1" />
            </View>
            <Text className="text-gray-800 font-bold text-xl mb-2 text-center">
              No packages found
            </Text>
            <Text className="text-gray-500 text-center text-sm">
              Try adjusting your filters or search query
            </Text>
          </View>
        )}

        {/* Results */}
        <View className="px-4 pb-6">
          {!loading && packages.length > 0 && (
            <Text className="text-lg font-bold text-gray-800 mb-4">
              ✨ {packages.length} Packages Found
            </Text>
          )}

          {packages.map((pkg, index) => (
            <TouchableOpacity
              key={pkg.id}
              className="bg-white rounded-3xl mb-4 overflow-hidden shadow-lg border border-gray-100"
              activeOpacity={0.9}
            >
              {/* Package Image Placeholder with Gradient */}
              <LinearGradient
                colors={[getPackageTypeColor(pkg.package_type), '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-48 justify-end p-5"
              >
                {pkg.is_trending && (
                  <View className="absolute top-4 right-4 bg-yellow-400 rounded-full px-4 py-2 flex-row items-center shadow-lg">
                    <Ionicons name="flame" size={16} color="#dc2626" />
                    <Text className="text-xs font-extrabold text-red-600 ml-1">
                      TRENDING
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center">
                  <View className="bg-white/20 backdrop-blur-md rounded-full p-2 mr-2">
                    <MaterialCommunityIcons
                      name={getPackageTypeIcon(pkg.package_type) as any}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <Text className="text-white font-bold capitalize">
                    {pkg.package_type}
                  </Text>
                </View>
              </LinearGradient>

              {/* Package Details */}
              <View className="p-5">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-xl font-extrabold text-gray-900 mb-1">
                      {pkg.name}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="location" size={14} color="#6b7280" />
                      <Text className="text-gray-600 ml-1 text-sm font-semibold">
                        {pkg.destination_name}
                      </Text>
                    </View>
                  </View>

                  {/* Price Badge */}
                  <View className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl px-4 py-2">
                    <Text className="text-xs text-purple-600 font-bold">
                      FROM
                    </Text>
                    <Text className="text-purple-900 font-extrabold text-lg">
                      {formatPrice(pkg.price_per_person)}
                    </Text>
                    <Text className="text-xs text-purple-600 font-semibold">
                      per person
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-600 text-sm mb-3 leading-5" numberOfLines={2}>
                  {pkg.description}
                </Text>

                {/* Duration & Tags */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <View className="bg-blue-50 rounded-lg px-3 py-2 flex-row items-center">
                      <Ionicons name="calendar" size={14} color="#3b82f6" />
                      <Text className="text-blue-600 font-bold ml-1 text-xs">
                        {pkg.duration_days}D/{pkg.duration_nights}N
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1">
                    {pkg.tags?.slice(0, 2).map((tag, i) => (
                      <View key={i} className="bg-gray-100 rounded-full px-2 py-1">
                        <Text className="text-gray-600 text-xs font-semibold">
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Book Now Button */}
                <TouchableOpacity className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl py-3 flex-row items-center justify-center">
                  <Text className="text-white font-extrabold mr-2">View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

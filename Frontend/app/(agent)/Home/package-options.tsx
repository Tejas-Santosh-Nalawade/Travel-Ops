import React, { useState } from 'react'
import { Text, View, ScrollView, TouchableOpacity, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

interface RecommendationOption {
  id: string
  title: string
  subtitle: string
  description: string
  icon: any
  iconBg: string
  iconColor: string
  route: string
  gradient: [string, string]
  features: string[]
  badge?: string
  badgeColor?: string
}

export default function PackageOptions() {
  const router = useRouter()
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))

  React.useEffect(() => {
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

  const options: RecommendationOption[] = [
    {
      id: 'budget',
      title: 'Budget Smart',
      subtitle: 'Find best deals within your budget',
      description: 'Get personalized package recommendations based on your budget range and preferences',
      icon: 'wallet',
      iconBg: '#dbeafe',
      iconColor: '#3b82f6',
      route: '/budget-packages',
      gradient: ['#3b82f6', '#2563eb'],
      features: [
        'Budget range filtering',
        'Price comparison',
        'Value for money packages',
        'Savings calculator'
      ],
      badge: 'MOST POPULAR',
      badgeColor: '#3b82f6'
    },
    {
      id: 'credit',
      title: 'Credit Card Offers',
      subtitle: 'Maximize rewards & cashback',
      description: 'Discover packages with exclusive credit card offers, cashback, and reward points',
      icon: 'card',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      route: '/credit-packages',
      gradient: ['#f59e0b', '#d97706'],
      features: [
        'Card-specific deals',
        'EMI options available',
        'Cashback & rewards',
        'Premium benefits'
      ],
      badge: 'SAVE MORE',
      badgeColor: '#f59e0b'
    },
    {
      id: 'ai',
      title: 'AI Trend Search',
      subtitle: 'Powered by social media insights',
      description: 'AI analyzes Instagram/YouTube trends to recommend viral destinations and experiences',
      icon: 'sparkles',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      route: '/ai-packages',
      gradient: ['#8b5cf6', '#7c3aed'],
      features: [
        'Social media trends',
        'Viral destinations',
        'Influencer recommendations',
        'Smart AI matching'
      ],
      badge: 'TRENDING',
      badgeColor: '#8b5cf6'
    }
  ]

  const handleSelectOption = (route: string) => {
    router.push(route as any)
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              Find Packages
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Choose your recommendation method
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }} 
          className="px-5 py-6"
        >
          {/* Hero Section */}
          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-gray-900 mb-2">
              Discover Your
            </Text>
            <Text className="text-3xl font-extrabold text-gray-900 mb-3">
              Perfect Journey
            </Text>
            <Text className="text-base text-gray-600">
              Choose how you'd like to explore packages tailored for your needs
            </Text>
          </View>

          {/* Options */}
          <View className="gap-5 mb-6">
            {options.map((option, index) => (
              <Animated.View
                key={option.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, index % 2 === 0 ? -50 : 50]
                    })
                  }]
                }}
              >
                <OptionCard
                  option={option}
                  onPress={() => handleSelectOption(option.route)}
                />
              </Animated.View>
            ))}
          </View>

          {/* Info Banner */}
          <View className="bg-blue-50 rounded-2xl p-5 border border-blue-200 mb-6">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="information-circle" size={24} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-blue-900 mb-1">
                  Smart Recommendations
                </Text>
                <Text className="text-sm text-blue-700">
                  Our AI-powered system analyzes millions of data points to provide you with the most relevant and cost-effective package options.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

/* ================= COMPONENTS ================= */

function OptionCard({
  option,
  onPress,
}: {
  option: RecommendationOption
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100"
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={option.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 relative"
      >
        {/* Badge */}
        {option.badge && (
          <View className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <Text 
              className="text-xs font-extrabold"
              style={{ color: option.badgeColor }}
            >
              {option.badge}
            </Text>
          </View>
        )}

        {/* Icon & Title */}
        <View className="flex-row items-center mb-3">
          <View 
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name={option.icon} size={28} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-white mb-1">
              {option.title}
            </Text>
            <Text className="text-sm text-white/90">
              {option.subtitle}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-sm text-white/80 leading-5">
          {option.description}
        </Text>
      </LinearGradient>

      {/* Features */}
      <View className="p-5">
        <View className="flex-row flex-wrap gap-3 mb-4">
          {option.features.map((feature, index) => (
            <View 
              key={index}
              className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2"
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={option.iconColor}
              />
              <Text className="text-xs font-semibold text-gray-700 ml-2">
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <Text className="text-sm font-semibold text-gray-600">
            Explore packages
          </Text>
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: option.iconBg }}
          >
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={option.iconColor}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

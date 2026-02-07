import React, { useEffect, useState } from 'react'
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

interface Journey {
  id: string
  customer_name: string
  status: string
  total_cost: number
  created_at: string
}

export default function Journeys() {
  const router = useRouter()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadJourneys()
  }, [])

  const loadJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setJourneys(data || [])
    } catch (error: any) {
      console.error('Error loading journeys:', error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadJourneys()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'FAILED': return 'bg-red-100 text-red-700'
      case 'ON_HOLD': return 'bg-orange-100 text-orange-700'
      case 'CANCELLED': return 'bg-gray-100 text-gray-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'checkmark-circle'
      case 'PENDING': return 'time'
      case 'FAILED': return 'close-circle'
      case 'ON_HOLD': return 'pause-circle'
      case 'CANCELLED': return 'ban'
      default: return 'document'
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">My Journeys</Text>
            <Text className="text-sm text-gray-500 mt-1">{journeys.length} total journeys</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(agent)/Create/create")}
            className="bg-blue-600 rounded-xl px-4 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="add-circle" size={20} color="#ffffff" />
            <Text className="text-white font-bold">New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {journeys.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="airplane-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-500 text-lg mt-4">No journeys yet</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center px-8">
            Start creating journeys for your customers
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="p-4 space-y-3">
            {journeys.map((journey, index) => (
              <TouchableOpacity
                key={journey.id || `journey-${index}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800 mb-1">
                      {journey.customer_name}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-1">
                      ID: {journey.id ? journey.id.slice(0, 8) + '...' : 'N/A'}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {new Date(journey.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full flex-row items-center ${getStatusColor(journey.status)}`}>
                    <Ionicons name={getStatusIcon(journey.status) as any} size={14} />
                    <Text className="ml-1 text-xs font-semibold">{journey.status}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="cash-outline" size={18} color="#6b7280" />
                    <Text className="ml-2 text-base font-semibold text-gray-800">
                      ₹{journey.total_cost.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

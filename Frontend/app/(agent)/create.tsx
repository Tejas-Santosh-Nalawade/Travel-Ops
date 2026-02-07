import React, { useState } from 'react'
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function CreateJourney() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('journeys')
        .insert({
          customer_name: customerName.trim(),
          created_by: user.id,
          status: 'DRAFT',
          total_cost: 0
        })
        .select()
        .single()

      if (error) throw error

      Alert.alert('Success', 'Journey created successfully!', [
        { text: 'OK', onPress: () => {
          setCustomerName('')
          router.push('/(agent)/journeys')
        }}
      ])
    } catch (error: any) {
      console.error('Error creating journey:', error.message)
      Alert.alert('Error', 'Failed to create journey')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="bg-white px-4 py-4 border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-800">Create New Journey</Text>
            <Text className="text-sm text-gray-500 mt-1">Start planning a customer journey</Text>
          </View>

          {/* Form */}
          <View className="p-4">
            {/* Customer Name */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Customer Name *</Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-800"
                placeholder="Enter customer name"
                placeholderTextColor="#9ca3af"
                value={customerName}
                onChangeText={setCustomerName}
                autoCapitalize="words"
              />
            </View>

            {/* Coming Soon Features */}
            <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text className="text-sm font-semibold text-blue-700 ml-2">More Features Coming Soon</Text>
              </View>
              <Text className="text-xs text-blue-600 leading-5">
                • Add flight details{"\n"}
                • Book hotels{"\n"}
                • Arrange transfers{"\n"}
                • Set budget limits{"\n"}
                • Add travel dates
              </Text>
            </View>

            {/* Info Card */}
            <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <View className="flex-row items-start">
                <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-1">Quick Tip</Text>
                  <Text className="text-xs text-gray-600 leading-5">
                    After creating the journey, you can add flight bookings, hotel reservations, and transfers from the journeys list.
                  </Text>
                </View>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || !customerName.trim()}
              className={`rounded-xl py-4 flex-row items-center justify-center ${
                loading || !customerName.trim() ? 'bg-gray-300' : 'bg-blue-600'
              }`}
              activeOpacity={0.8}
            >
              {loading ? (
                <Text className="text-white font-semibold text-base">Creating...</Text>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={24} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">Create Journey</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

import React, { useEffect, useState } from 'react'
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

interface Stats {
  totalUsers: number
  totalJourneys: number
  totalIncidents: number
  criticalAlerts: number
}

interface Notification {
  id: string
  message: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalJourneys: 0,
    totalIncidents: 0,
    criticalAlerts: 0
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    loadDashboard()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/sign-in')
      return
    }
    setUser(user)
  }

  const loadDashboard = async () => {
    try {
      // Load stats
      const [journeysRes, incidentsRes, alertsRes, notificationsRes] = await Promise.all([
        supabase.from('journeys').select('id', { count: 'exact' }),
        supabase.from('incidents').select('id', { count: 'exact' }).eq('status', 'OPEN'),
        supabase.from('ops_alerts').select('id', { count: 'exact' }).eq('status', 'OPEN'),
        supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      setStats({
        totalUsers: 0,
        totalJourneys: journeysRes.count || 0,
        totalIncidents: incidentsRes.count || 0,
        criticalAlerts: alertsRes.count || 0
      })

      setNotifications(notificationsRes.data || [])
    } catch (error: any) {
      console.error('Error loading dashboard:', error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboard()
  }

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut()
            if (error) {
              Alert.alert('Error', error.message)
            } else {
              router.replace('/sign-in')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-800">Admin Dashboard</Text>
            <Text className="text-sm text-gray-500 mt-1">System Overview & Management</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Grid */}
        <View className="p-4">
          <View className="flex-row flex-wrap -mx-2">
            {/* Total Journeys */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-3">
                  <Ionicons name="airplane" size={24} color="#3b82f6" />
                </View>
                <Text className="text-2xl font-bold text-gray-800">{stats.totalJourneys}</Text>
                <Text className="text-sm text-gray-500 mt-1">Total Journeys</Text>
              </View>
            </View>

            {/* Open Incidents */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-3">
                  <Ionicons name="warning" size={24} color="#ef4444" />
                </View>
                <Text className="text-2xl font-bold text-gray-800">{stats.totalIncidents}</Text>
                <Text className="text-sm text-gray-500 mt-1">Open Incidents</Text>
              </View>
            </View>

            {/* Critical Alerts */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <View className="w-12 h-12 rounded-full bg-orange-100 items-center justify-center mb-3">
                  <Ionicons name="alert-circle" size={24} color="#f97316" />
                </View>
                <Text className="text-2xl font-bold text-gray-800">{stats.criticalAlerts}</Text>
                <Text className="text-sm text-gray-500 mt-1">Active Alerts</Text>
              </View>
            </View>

            {/* System Status */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                </View>
                <Text className="text-2xl font-bold text-gray-800">Online</Text>
                <Text className="text-sm text-gray-500 mt-1">System Status</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Notifications */}
        <View className="px-4 pb-4">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-800">Recent Notifications</Text>
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
            </View>

            {notifications.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 text-sm mt-3">No notifications</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <View
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.status === 'SENT'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className="text-sm text-gray-800 mb-1">{notification.message}</Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Quick Actions</Text>
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center">
                <Ionicons name="people-outline" size={24} color="#8b5cf6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-semibold text-gray-800">Manage Users</Text>
                <Text className="text-xs text-gray-500 mt-1">View and manage user accounts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="settings-outline" size={24} color="#3b82f6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-semibold text-gray-800">System Settings</Text>
                <Text className="text-xs text-gray-500 mt-1">Configure system preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center">
                <Ionicons name="analytics-outline" size={24} color="#22c55e" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-semibold text-gray-800">View Reports</Text>
                <Text className="text-xs text-gray-500 mt-1">Access system reports and analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
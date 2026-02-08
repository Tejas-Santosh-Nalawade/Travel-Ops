import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function JourneyDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const journeyId = id || "JRN-1098";

    const timelineSteps = [
        {
            id: 1,
            type: 'SUCCESS',
            category: 'Flight Booking',
            provider: 'Air India',
            price: '12,400',
            statusText: 'Completed 14:20',
            icon: 'airplane',
            iconType: 'Ionicons',
            nodeBg: '#10b981',
            nodeIcon: 'checkmark',
            badgeBg: '#dcfce7',
            badgeText: '#15803d',
            lineColor: '#3b82f6',
        },
        {
            id: 2,
            type: 'IN-PROGRESS',
            category: 'Ground Transfer',
            provider: 'Uber for Business',
            price: '1,200',
            statusText: 'Orchestrating...',
            icon: 'car',
            iconType: 'FontAwesome5',
            nodeBg: '#f59e0b',
            nodeIcon: 'sync',
            badgeBg: '#fef3c7',
            badgeText: '#b45309',
            lineColor: '#e5e7eb',
        },
        {
            id: 3,
            type: 'PENDING',
            category: 'Hotel Reservation',
            provider: 'Taj Hotels',
            price: '32,000',
            statusText: 'Waiting...',
            icon: 'bed-outline',
            iconType: 'Ionicons',
            nodeBg: '#d1d5db',
            nodeIcon: 'time-outline',
            badgeBg: '#f3f4f6',
            badgeText: '#4b5563',
            lineColor: '#e5e7eb',
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 py-3 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#3b82f6" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">{journeyId}</Text>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
                </TouchableOpacity>
            </View>
            <View className="h-[1px] bg-gray-50 w-full" />

            {/* Breadcrumbs */}
            <View className="px-5 py-4">
                <Text className="text-[11px] font-bold tracking-widest text-[#3b82f6]">
                    JOURNEYS <Text className="text-gray-300">›</Text> <Text className="text-gray-400">ACTIVE</Text>
                </Text>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <View className="mt-2">
                    {timelineSteps.map((step, index) => (
                        <View key={step.id} className="flex-row">
                            {/* Timeline Column */}
                            <View className="items-center mr-4">
                                {/* Node */}
                                <View
                                    className="w-7 h-7 rounded-full items-center justify-center z-10"
                                    style={{ backgroundColor: step.nodeBg }}
                                >
                                    <Ionicons name={step.nodeIcon as any} size={15} color="white" />
                                </View>

                                {/* Vertical Line */}
                                {index !== timelineSteps.length - 1 && (
                                    <View
                                        style={{
                                            backgroundColor: step.lineColor,
                                            width: 2,
                                            flex: 1,
                                            marginVertical: -2
                                        }}
                                    />
                                )}
                            </View>

                            {/* Card Column */}
                            <View className="flex-1 pb-10">
                                {/* Status Bar */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <View
                                        className="px-3 py-1 rounded-md"
                                        style={{ backgroundColor: step.badgeBg }}
                                    >
                                        <Text className="text-[10px] font-bold tracking-wider" style={{ color: step.badgeText }}>
                                            {step.type}
                                        </Text>
                                    </View>
                                    <Text className="text-[11px] text-gray-400 italic">
                                        {step.statusText}
                                    </Text>
                                </View>

                                {/* Content Card */}
                                <View
                                    className={`bg-white rounded-2xl p-5 border ${step.type === 'IN-PROGRESS' ? 'border-blue-200 border-2 shadow-sm' : 'border-gray-100'}`}
                                    style={step.type === 'IN-PROGRESS' ? {
                                        shadowColor: '#3b82f6',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.08,
                                        shadowRadius: 10,
                                        elevation: 5
                                    } : {}}
                                >
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1">
                                            <Text className="text-[13px] text-gray-400 font-medium mb-1">{step.category}</Text>
                                            <Text className="text-[17px] font-bold text-gray-900 mb-1">{step.provider}</Text>
                                            <Text className="text-[18px] font-bold text-[#3b82f6]">₹{step.price}</Text>
                                        </View>

                                        <View className={`w-11 h-11 rounded-xl items-center justify-center ${step.type === 'PENDING' ? 'bg-gray-50' : 'bg-[#ebf3ff]'}`}>
                                            {step.iconType === 'Ionicons' ? (
                                                <Ionicons name={step.icon as any} size={22} color={step.type === 'PENDING' ? '#ced4da' : '#3b82f6'} />
                                            ) : (
                                                <FontAwesome5 name={step.icon} size={18} color={step.type === 'PENDING' ? '#ced4da' : '#3b82f6'} />
                                            )}
                                        </View>
                                    </View>

                                    <TouchableOpacity className="mt-5 flex-row items-center">
                                        <MaterialIcons name="featured-play-list" size={18} color="#3b82f6" />
                                        <Text className="ml-2 font-bold text-[#3b82f6]">View Logs</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>


        </SafeAreaView>
    );
}

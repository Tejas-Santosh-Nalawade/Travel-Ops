import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';

export default function JourneyDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [journey, setJourney] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [decision, setDecision] = useState<any>(null);

    useEffect(() => {
        if (id) {
            loadJourneyDetails();
            loadDecision();
        }
    }, [id]);

    const loadDecision = async () => {
        const { data } = await supabase
            .from('decisions')
            .select('*')
            .eq('journey_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) setDecision(data);
    };

    const loadJourneyDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('journeys')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setJourney(data);
        } catch (error: any) {
            console.error('Error loading journey details:', error.message);
            Alert.alert('Error', 'Failed to load journey details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return ['#dcfce7', '#166534']; // bg, text
            case 'PENDING': return ['#fef9c3', '#854d0e'];
            case 'FAILED': return ['#fee2e2', '#991b1b'];
            case 'ON_HOLD': return ['#ffedd5', '#9a3412'];
            case 'CANCELLED': return ['#f3f4f6', '#1f2937'];
            default: return ['#dbeafe', '#1e40af'];
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!journey) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <Text className="text-gray-500 text-lg">Journey not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3 bg-blue-500 rounded-lg">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const [statusBg, statusText] = getStatusColor(journey.status);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-white shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Journey Details</Text>
                <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                    <Ionicons name="ellipsis-horizontal" size={24} color="#1f2937" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
                {/* Main Card */}
                <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
                    <View className="flex-row justify-between items-start mb-6">
                        <View>
                            <Text className="text-sm text-gray-400 font-medium mb-1">Customer</Text>
                            <Text className="text-2xl font-bold text-gray-900">{journey.customer_name}</Text>
                        </View>
                        <View style={{ backgroundColor: statusBg }} className="px-3 py-1.5 rounded-full">
                            <Text style={{ color: statusText }} className="text-xs font-bold uppercase tracking-wider">
                                {journey.status}
                            </Text>
                        </View>
                    </View>

                    <View className="h-px bg-gray-100 mb-6" />

                    {/* Route Info (Mocked since schema issues, but ready for data) */}
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="items-start flex-1">
                            <Text className="text-3xl font-bold text-gray-900">
                                {journey.source_city || "NYC"}
                            </Text>
                            <Text className="text-gray-400 text-xs">Origin</Text>
                        </View>

                        <View className="flex-1 items-center px-4">
                            <View className="w-full h-px bg-gray-200 absolute top-4" />
                            <Ionicons name="airplane" size={24} color="#3b82f6" className="bg-white px-2" />
                            <Text className="text-xs text-gray-400 mt-1">Direct</Text>
                        </View>

                        <View className="items-end flex-1">
                            <Text className="text-3xl font-bold text-gray-900">
                                {journey.destination_city || "LDN"}
                            </Text>
                            <Text className="text-gray-400 text-xs">Destination</Text>
                        </View>
                    </View>

                    {/* Details Grid */}
                    <View className="flex-row flex-wrap -mx-2">
                        <View className="w-1/2 px-2 mb-4">
                            <View className="bg-gray-50 rounded-2xl p-4">
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" className="mb-2" />
                                <Text className="text-gray-400 text-xs mb-1">Date</Text>
                                <Text className="text-gray-900 font-semibold">
                                    {new Date(journey.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                        <View className="w-1/2 px-2 mb-4">
                            <View className="bg-gray-50 rounded-2xl p-4">
                                <Ionicons name="people-outline" size={20} color="#6b7280" className="mb-2" />
                                <Text className="text-gray-400 text-xs mb-1">Travelers</Text>
                                <Text className="text-gray-900 font-semibold">
                                    {journey.travelers || "2 Adults"}
                                </Text>
                            </View>
                        </View>
                        <View className="w-1/2 px-2">
                            <View className="bg-gray-50 rounded-2xl p-4">
                                <Ionicons name="pricetag-outline" size={20} color="#6b7280" className="mb-2" />
                                <Text className="text-gray-400 text-xs mb-1">Total Cost</Text>
                                <Text className="text-green-600 font-bold text-lg">
                                    ₹{journey.total_cost.toLocaleString('en-IN')}
                                </Text>
                            </View>
                        </View>
                        <View className="w-1/2 px-2">
                            <View className="bg-gray-50 rounded-2xl p-4">
                                <Ionicons name="briefcase-outline" size={20} color="#6b7280" className="mb-2" />
                                <Text className="text-gray-400 text-xs mb-1">Type</Text>
                                <Text className="text-gray-900 font-semibold capitalize">
                                    {journey.trip_purpose || "Business"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Operations Decision Alert */}
                {decision && (
                    <View className="bg-orange-50 rounded-2xl p-4 border border-orange-200 mb-6">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="warning-outline" size={24} color="#ea580c" />
                            <Text className="text-orange-900 font-bold ml-2 text-lg">Operations Decision</Text>
                        </View>
                        <Text className="text-orange-800 font-bold text-base mb-1">Action: {decision.decision}</Text>
                        <Text className="text-orange-700 text-sm italic mb-2">"{decision.notes}"</Text>
                        <Text className="text-orange-500 text-xs text-right">
                            {new Date(decision.created_at).toLocaleString()}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
                <View className="gap-3 mb-8">
                    <TouchableOpacity className="bg-white p-4 rounded-xl flex-row items-center border border-gray-100 shadow-sm">
                        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
                            <Ionicons name="create-outline" size={20} color="#2563eb" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-semibold text-gray-900">Edit Journey</Text>
                            <Text className="text-xs text-gray-500">Update details or preferences</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-white p-4 rounded-xl flex-row items-center border border-gray-100 shadow-sm">
                        <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4">
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#16a34a" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-semibold text-gray-900">Contact Customer</Text>
                            <Text className="text-xs text-gray-500">Send itinerary or updates</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-white p-4 rounded-xl flex-row items-center border border-gray-100 shadow-sm">
                        <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                            <Ionicons name="trash-outline" size={20} color="#dc2626" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-semibold text-red-600">Cancel Journey</Text>
                            <Text className="text-xs text-gray-500">This action cannot be undone</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Footer CTA */}
            <View className="p-5 bg-white border-t border-gray-100">
                <TouchableOpacity className="w-full">
                    <LinearGradient
                        colors={['#3b82f6', '#2563eb']}
                        className="p-4 rounded-2xl items-center shadow-lg"
                    >
                        <Text className="text-white font-bold text-lg">Download Itinerary</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

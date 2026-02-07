
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { GradientHeader, ActionButton, StatusBadge } from '../../../component/UIKit';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <View className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 ${className}`}>
        {children}
    </View>
);

export default function DecisionScreen() {
    const router = useRouter();
    const { journeyId } = useLocalSearchParams();
    const [journey, setJourney] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [decisionType, setDecisionType] = useState('RETRY');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (journeyId) {
            loadJourney();
        }
    }, [journeyId]);

    const loadJourney = async () => {
        try {
            const { data, error } = await supabase
                .from('journeys')
                .select('*')
                .eq('id', journeyId)
                .single();

            if (error) throw error;
            setJourney(data);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const submitDecision = async () => {
        if (!notes.trim()) {
            Alert.alert('Required', 'Please add notes for this decision.');
            return;
        }

        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            // Record the decision
            const { error: decisionError } = await supabase
                .from('decisions')
                .insert({
                    journey_id: journeyId,
                    decision: decisionType,
                    notes: notes,
                    created_by: user.id
                });

            if (decisionError) throw decisionError;

            // If Rollback, navigate to engine
            if (decisionType === 'ROLLBACK') {
                router.push({
                    pathname: '/(ops)/Home/rollback',
                    params: { journeyId }
                });
                return;
            }

            // Update journey status based on decision
            let newStatus = journey?.status || 'PENDING';
            if (decisionType === 'APPROVE') newStatus = 'CONFIRMED';
            if (decisionType === 'RETRY') newStatus = 'PROCESSING';
            if (decisionType === 'HOLD') newStatus = 'ON_HOLD';
            if (decisionType === 'REPLACE') newStatus = 'PENDING_REPLACEMENT';

            const { error: updateError } = await supabase
                .from('journeys')
                .update({ status: newStatus })
                .eq('id', journeyId);

            if (updateError) throw updateError;

            Alert.alert('Success', 'Decision recorded and executed', [
                { text: 'Back to Dashboard', onPress: () => router.push('/(ops)/Home/dashboard') }
            ]);

        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message || 'Failed to submit decision');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="relative">
                <GradientHeader
                    title="Make Decision"
                    subtitle={`Ref: ${journeyId ? String(journeyId).slice(0, 8) : ''}`}
                />
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute left-4 top-4 bg-white/20 p-2 rounded-full z-10"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
                {journey && (
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Journey Context</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-1">{journey.customer_name}</Text>
                        <View className="flex-row items-center justify-between mt-2">
                            <StatusBadge status={journey.status} />
                            <Text className="text-gray-500 font-mono text-sm">₹{journey.total_cost?.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                <View className="mb-6">
                    <Text className="text-gray-900 font-bold text-lg mb-3">Select Action</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {['APPROVE', 'RETRY', 'REPLACE', 'ROLLBACK', 'HOLD'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setDecisionType(type)}
                                className={`px-5 py-3 rounded-xl border-2 ${decisionType === type
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <Text className={`font-bold ${decisionType === type ? 'text-blue-700' : 'text-gray-600'
                                    }`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-gray-900 font-bold text-lg mb-3">Decision Notes</Text>
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl p-4 text-gray-900 h-32"
                        placeholder="Explain the reason for this decision..."
                        multiline
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                <TouchableOpacity
                    onPress={submitDecision}
                    disabled={submitting}
                    className={`w-full py-4 rounded-xl items-center shadow-lg ${submitting ? 'bg-gray-400' : 'bg-blue-600 shadow-blue-200'
                        }`}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text className="text-white font-bold text-lg">Execute Decision</Text>
                        </View>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

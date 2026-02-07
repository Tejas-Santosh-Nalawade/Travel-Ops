
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

// Steps for the rollback process
const STEPS = [
    { id: 1, title: 'Initiating Rollback', icon: 'refresh-circle-outline' as const },
    { id: 2, title: 'Cancelling Reservations', icon: 'close-circle-outline' as const },
    { id: 3, title: 'Processing Refund', icon: 'card-outline' as const },
    { id: 4, title: 'Notifying Customer', icon: 'mail-outline' as const },
    { id: 5, title: 'Rollback Complete', icon: 'checkmark-done-circle-outline' as const },
];

export default function RollbackScreen() {
    const router = useRouter();
    const { journeyId } = useLocalSearchParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [status, setStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILED'>('PROCESSING');

    // Animation values
    const scaleAnims = useRef(STEPS.map(() => new Animated.Value(0.8))).current;
    const opacityAnims = useRef(STEPS.map(() => new Animated.Value(0.5))).current;

    useEffect(() => {
        startRollback();
    }, []);

    const startRollback = async () => {
        try {
            // Simulate process steps
            for (let i = 0; i < STEPS.length; i++) {
                setCurrentStep(i);
                animateStep(i);

                // Random delay for realism
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            // Finalize in DB
            if (journeyId) {
                const { error } = await supabase
                    .from('journeys')
                    .update({ status: 'CANCELLED' })
                    .eq('id', journeyId);

                if (error) throw error;
            }

            setStatus('SUCCESS');

        } catch (e) {
            console.error(e);
            setStatus('FAILED');
        }
    };

    const animateStep = (index: number) => {
        Animated.parallel([
            Animated.timing(scaleAnims[index], {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnims[index], {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 py-8">
                {/* Header */}
                <View className="mb-8 items-center">
                    <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="warning-outline" size={32} color="#dc2626" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2">Rolling Back Journey</Text>
                    <Text className="text-gray-500 text-sm">Ref: {journeyId ? String(journeyId).slice(0, 8) : '...'}</Text>
                </View>

                {/* Steps Timeline */}
                <View className="flex-1 justify-center">
                    {STEPS.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <Animated.View
                                key={step.id}
                                className="flex-row items-center mb-6 relative"
                                style={{
                                    transform: [{ scale: scaleAnims[index] }],
                                    opacity: opacityAnims[index]
                                }}
                            >
                                {/* Connecting Line */}
                                {index !== STEPS.length - 1 && (
                                    <View className="absolute left-[20px] top-[40px] w-[2px] h-[24px] bg-gray-100" />
                                )}

                                <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isActive ? 'bg-red-50 border-red-500' :
                                    isCompleted ? 'bg-gray-100 border-gray-400' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    {isCompleted ? (
                                        <Ionicons name="checkmark" size={20} color="#6b7280" />
                                    ) : (
                                        <Ionicons name={step.icon} size={20} color={isActive ? "#dc2626" : "#9ca3af"} />
                                    )}
                                </View>

                                <View className="ml-4 flex-1">
                                    <Text className={`font-semibold text-lg ${isActive ? 'text-red-600' :
                                        isCompleted ? 'text-gray-500 line-through' : 'text-gray-400'
                                        }`}>
                                        {step.title}
                                    </Text>
                                    {isActive && status === 'PROCESSING' && (
                                        <Text className="text-xs text-red-400 mt-1">Processing...</Text>
                                    )}
                                </View>

                                {isActive && status === 'PROCESSING' && (
                                    <ActivityIndicator size="small" color="#dc2626" />
                                )}
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Footer Actions */}
                <View className="mt-auto">
                    {status === 'SUCCESS' && (
                        <View className="items-center">
                            <Text className="text-xl font-bold text-gray-900 mb-2">Rollback Successful</Text>
                            <Text className="text-gray-500 text-center mb-6">The journey has been cancelled and refunds processed.</Text>

                            <TouchableOpacity
                                className="w-full bg-gray-900 py-4 rounded-xl items-center shadow-lg"
                                onPress={() => router.push('/(ops)/Home/dashboard')}
                            >
                                <Text className="text-white font-bold text-lg">Return to Dashboard</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

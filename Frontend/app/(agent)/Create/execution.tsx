
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

// Steps for the execution process
const STEPS = [
    { id: 1, title: 'Validating Journey Structure', icon: 'scan-outline' as const },
    { id: 2, title: 'Checking Availability', icon: 'calendar-outline' as const },
    { id: 3, title: 'Reserving Inventory', icon: 'cart-outline' as const },
    { id: 4, title: 'Processing Payment', icon: 'card-outline' as const },
    { id: 5, title: 'Generating Tickets', icon: 'ticket-outline' as const },
];

export default function ExecutionScreen() {
    const router = useRouter();
    const { journeyId } = useLocalSearchParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [status, setStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILED'>('PROCESSING');
    const [errorMsg, setErrorMsg] = useState('');

    // Animation values
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef(STEPS.map(() => new Animated.Value(0.8))).current;
    const opacityAnims = useRef(STEPS.map(() => new Animated.Value(0.5))).current;

    useEffect(() => {
        startExecution();
    }, []);

    const startExecution = async () => {
        // Simulate process steps
        for (let i = 0; i < STEPS.length; i++) {
            setCurrentStep(i);
            animateStep(i);

            // Random delay for realism
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Finalize
        try {
            if (journeyId) {
                const { error } = await supabase
                    .from('journeys')
                    .update({ status: 'PENDING_APPROVAL' })
                    .eq('id', journeyId);

                if (error) throw error;
            }

            setStatus('SUCCESS');
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false
            }).start();

        } catch (e: any) {
            setStatus('FAILED');
            setErrorMsg(e.message || 'Execution failed');
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
                    <Text className="text-2xl font-bold text-gray-900 mb-2">Executing Journey</Text>
                    <Text className="text-gray-500 text-sm">Ref: {journeyId ? String(journeyId).slice(0, 8) : 'Pending...'}</Text>
                </View>

                {/* Steps Timeline */}
                <View className="flex-1 justify-center">
                    {STEPS.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <Animated.View
                                key={step.id}
                                className="flex-row items-center mb-8 relative"
                                style={{
                                    transform: [{ scale: scaleAnims[index] }],
                                    opacity: opacityAnims[index]
                                }}
                            >
                                {/* Connecting Line */}
                                {index !== STEPS.length - 1 && (
                                    <View className="absolute left-[20px] top-[40px] w-[2px] h-[32px] bg-gray-100" />
                                )}

                                <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isActive ? 'bg-blue-50 border-blue-500' :
                                    isCompleted ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    {isCompleted ? (
                                        <Ionicons name="checkmark" size={20} color="#16a34a" />
                                    ) : (
                                        <Ionicons name={step.icon} size={20} color={isActive ? "#2563eb" : "#9ca3af"} />
                                    )}
                                </View>

                                <View className="ml-4 flex-1">
                                    <Text className={`font-semibold text-lg ${isActive ? 'text-blue-600' :
                                        isCompleted ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        {step.title}
                                    </Text>
                                    {isActive && status === 'PROCESSING' && (
                                        <Text className="text-xs text-blue-400 mt-1">Processing...</Text>
                                    )}
                                </View>

                                {isActive && status === 'PROCESSING' && (
                                    <ActivityIndicator size="small" color="#2563eb" />
                                )}
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Footer Actions */}
                <View className="mt-auto">
                    {status === 'SUCCESS' && (
                        <View className="items-center">
                            <View className="w-16 h-16 bg-yellow-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="time-outline" size={32} color="#ca8a04" />
                            </View>
                            <Text className="text-xl font-bold text-gray-900 mb-2">Waiting for Approval</Text>
                            <Text className="text-gray-500 text-center mb-6">Your journey has been submitted and is awaiting operator confirmation.</Text>

                            <TouchableOpacity
                                className="w-full bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-200"
                                onPress={() => router.push('/(agent)/Journey/journeys')}
                            >
                                <Text className="text-white font-bold text-lg">Go to Journeys</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {status === 'FAILED' && (
                        <View className="items-center">
                            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="alert-circle" size={32} color="#dc2626" />
                            </View>
                            <Text className="text-xl font-bold text-gray-900 mb-2">Execution Failed</Text>
                            <Text className="text-gray-500 text-center mb-6">{errorMsg || 'An unexpected error occurred during booking.'}</Text>

                            <View className="w-full flex-row gap-4">
                                <TouchableOpacity
                                    className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                                    onPress={() => router.back()}
                                >
                                    <Text className="text-gray-700 font-bold">Edit Journey</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-red-600 py-4 rounded-xl items-center shadow-lg shadow-red-200"
                                    onPress={startExecution}
                                >
                                    <Text className="text-white font-bold">Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

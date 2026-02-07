
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

// Types
type SegmentType = 'FLIGHT' | 'TRANSFER' | 'ACCOMMODATION' | 'TERMINAL';

interface Segment {
  id: string;
  type: SegmentType;
  title: string;
  subtitle?: string;
  details?: any;
  time?: string;
  price: number;
}

export default function BuildJourney() {
  const router = useRouter();
  const [clientName, setClientName] = useState("Rohan Sharma");
  const [refId] = useState("#8921-X");
  const [segments, setSegments] = useState<Segment[]>([
    {
      id: '1',
      type: 'FLIGHT',
      title: 'DEL → LHR',
      subtitle: 'Indigo 6E-11 • Economy',
      time: '04:30 AM',
      price: 45000,
      details: {
        departs: '04:30 AM',
        arrives: '10:15 AM',
        duration: '9H 45M'
      }
    },
    {
      id: '2',
      type: 'TRANSFER',
      title: 'Airport Pickup',
      subtitle: 'Private Sedan • Heathrow Terminal 5',
      time: '11:00 AM',
      price: 5000,
    },
    {
      id: '3',
      type: 'ACCOMMODATION',
      title: 'The Savoy Hotel',
      subtitle: 'Deluxe King Room • Breakfast Incl.',
      time: 'Oct 12 - Oct 16 (4 Nights)',
      price: 400000,
      details: {
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      }
    }
  ]);

  // Modal States
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedType, setSelectedType] = useState<SegmentType | null>(null);
  const [insertIndex, setInsertIndex] = useState<number>(-1);

  // Form States
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formPrice, setFormPrice] = useState("");

  const totalEstimate = segments.reduce((sum, seg) => sum + seg.price, 0);

  const handleAddPress = (index: number) => {
    setInsertIndex(index);
    setShowTypeModal(true);
  };

  const handleTypeSelect = (type: SegmentType) => {
    setSelectedType(type);
    setShowTypeModal(false);
    setShowFormModal(true);
    // Reset form
    setFormTitle("");
    setFormSubtitle("");
    setFormPrice("");
  };

  const handleSaveSegment = () => {
    if (!formTitle || !selectedType) {
      Alert.alert("Missing Fields", "Please fill in the title");
      return;
    }

    const newSegment: Segment = {
      id: Date.now().toString(),
      type: selectedType,
      title: formTitle,
      subtitle: formSubtitle,
      time: 'TBD',
      price: parseInt(formPrice) || 0,
      details: {}
    };

    const newSegments = [...segments];
    // If insertIndex is -1, add to end (Terminal segment logic if implemented, otherwise just push)
    // Here we use insertIndex to place it between existing segments
    if (insertIndex !== -1) {
      newSegments.splice(insertIndex + 1, 0, newSegment);
    } else {
      newSegments.push(newSegment);
    }

    setSegments(newSegments);
    setShowFormModal(false);
  };

  const handleSaveDraft = () => {
    Alert.alert("Draft Saved", "Your journey has been saved as a draft.");
  };

  const handleExecute = async () => {
    // Here we would save to Supabase
    // Using the same logic as before but adapted
    try {
      // 1. Get User ID (Handle "Agent Smith" or Auth)
      let creatorId = "00000000-0000-0000-0000-000000000000";

      try {
        // FK Fix: Trigger on 'journeys' references 'customers' table.
        // We must ensure creatorId exists in 'customers'.

        // Priority 1: Check 'customers' table directly
        const { data: validCustomer } = await supabase
          .from('customers')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (validCustomer) {
          creatorId = validCustomer.id;
        } else {
          // Priority 2: Check auth user (if they happen to be in customers)
          const { data: { user } } = await supabase.auth.getUser();
          if (user) creatorId = user.id;
        }
      } catch (err) {
        console.log("Error resolving customer ID:", err);
      }

      // 2. Insert Journey into Database
      const { data, error } = await supabase
        .from('journeys')
        .insert({
          customer_name: clientName,
          created_by: creatorId,
          status: 'DRAFT',
          total_cost: totalEstimate
        })
        .select()
        .single();

      if (error) throw error;
      const journey = data;

      // 3. Navigate to Execution
      Alert.alert("Success", "Journey created! Proceeding to validation.", [
        {
          text: "Execute Journey",
          onPress: () => router.push({
            pathname: '/(agent)/Create/execution',
            params: { journeyId: journey.id }
          })
        }
      ]);

    } catch (e: any) {
      console.error("Journey creation failed:", e);
      Alert.alert("Error", e.message || 'Failed to create journey');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100 flex-row items-center justify-between z-10">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Build Journey</Text>
        </View>
        <TouchableOpacity onPress={handleSaveDraft}>
          <Text className="text-blue-600 font-semibold">Save Draft</Text>
        </TouchableOpacity>
      </View>

      {/* Client Info Bar */}
      <View className="bg-white px-5 py-3 border-b border-gray-100 mb-2">
        <Text className="text-gray-500 text-sm">
          Client: <Text className="text-gray-900 font-medium">{clientName}</Text> • Ref: {refId}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-5 py-4">
          {segments.map((segment, index) => (
            <View key={segment.id} className="relative pl-8">
              {/* Vertical Line */}
              {index !== segments.length - 1 && (
                <View className="absolute left-[19px] top-10 bottom-[-40px] w-[2px] bg-blue-100 z-0" />
              )}

              {/* Segment Node */}
              <View className="absolute left-0 top-0 z-10">
                {getSegmentIcon(segment.type)}
              </View>

              {/* Content Card */}
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {segment.type}
                  </Text>
                  <Ionicons name="grid-outline" size={16} color="#9ca3af" />
                </View>

                {segment.type === 'FLIGHT' && (
                  <View>
                    <Text className="text-xl font-bold text-gray-900 mb-2">{segment.title}</Text>
                    <View className="flex-row justify-between items-center mb-3">
                      <View>
                        <Text className="text-gray-400 text-xs text-left mb-1">Departs</Text>
                        <Text className="text-gray-900 font-semibold">{segment.details?.departs}</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-gray-300 text-[10px] mb-1">{segment.details?.duration}</Text>
                        <View className="h-[1px] w-12 bg-gray-200" />
                      </View>
                      <View>
                        <Text className="text-gray-400 text-xs text-right mb-1">Arrives</Text>
                        <Text className="text-gray-900 font-semibold text-right">{segment.details?.arrives}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2 bg-blue-50 p-2 rounded-lg self-start">
                      <Ionicons name="airplane" size={12} color="#2563eb" />
                      <Text className="text-blue-700 text-xs font-medium">{segment.subtitle}</Text>
                    </View>
                  </View>
                )}

                {segment.type === 'TRANSFER' && (
                  <View>
                    <Text className="text-lg font-bold text-gray-900 mb-1">{segment.title}</Text>
                    <Text className="text-gray-500 text-sm mb-3">{segment.subtitle}</Text>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                        <Text className="text-gray-500 text-sm">{segment.time}</Text>
                      </View>
                      <TouchableOpacity className="bg-blue-50 px-3 py-1.5 rounded-lg">
                        <Text className="text-blue-600 text-xs font-semibold">Edit Route</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {segment.type === 'ACCOMMODATION' && (
                  <View>
                    {segment.details?.image && (
                      <Image
                        source={{ uri: segment.details.image }}
                        className="w-full h-32 rounded-xl mb-3"
                        resizeMode="cover"
                      />
                    )}
                    <View className="flex-row justify-between items-start">
                      <Text className="text-lg font-bold text-gray-900 mb-1 flex-1 mr-2">{segment.title}</Text>
                      <View className="flex-row items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                        <Ionicons name="star" size={10} color="#f59e0b" />
                        <Text className="text-yellow-700 text-xs font-bold">{segment.details?.rating || '5.0'}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 mb-1">
                      <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                      <Text className="text-gray-500 text-sm">{segment.time}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="bed-outline" size={14} color="#6b7280" />
                      <Text className="text-gray-500 text-sm">{segment.subtitle}</Text>
                    </View>
                  </View>
                )}

              </View>

              {/* Add Button Between Segments */}
              <View className="absolute left-[4px] bottom-[-20px] z-20">
                <TouchableOpacity
                  onPress={() => handleAddPress(index)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm"
                >
                  <Ionicons name="add" size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Terminal Segment Button */}
          <View className="mt-8 ml-8">
            <TouchableOpacity
              onPress={() => handleAddPress(segments.length - 1)}
              className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-row items-center justify-center border-dashed"
            >
              <Ionicons name="add-circle" size={24} color="#2563eb" />
              <Text className="text-blue-600 font-semibold ml-2">Add Terminal Segment</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-500 font-bold text-xs uppercase tracking-widest">Total Estimate</Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-green-100 px-2 py-0.5 rounded-md flex-row items-center">
              <Ionicons name="checkmark-circle" size={10} color="#16a34a" />
              <Text className="text-green-700 text-[10px] font-bold ml-1">PRICES VALID</Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-3xl font-bold text-gray-900">₹{totalEstimate.toLocaleString('en-IN')}</Text>
          <Text className="text-gray-400 text-xs mb-1">Incl. taxes and service fees</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleExecute}
          className="w-full"
        >
          <LinearGradient
            colors={['#2563eb', '#1d4ed8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-200"
          >
            <Text className="text-white font-bold text-lg mr-2">Validate & Execute Journey</Text>
            <Ionicons name="rocket-outline" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Selection Modal */}
      <Modal visible={showTypeModal} transparent animationType="fade" onRequestClose={() => setShowTypeModal(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center p-5"
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View className="bg-white rounded-2xl w-full p-2">
            <Text className="text-center font-bold text-gray-900 text-lg py-4 border-b border-gray-100">Add Segment</Text>
            <View className="flex-row justify-around p-6">
              <TouchableOpacity className="items-center gap-2" onPress={() => handleTypeSelect('FLIGHT')}>
                <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center">
                  <Ionicons name="airplane" size={24} color="#2563eb" />
                </View>
                <Text className="text-xs font-medium text-gray-600">Flight</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center gap-2" onPress={() => handleTypeSelect('ACCOMMODATION')}>
                <View className="w-14 h-14 bg-orange-50 rounded-full items-center justify-center">
                  <Ionicons name="bed" size={24} color="#ea580c" />
                </View>
                <Text className="text-xs font-medium text-gray-600">Hotel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center gap-2" onPress={() => handleTypeSelect('TRANSFER')}>
                <View className="w-14 h-14 bg-green-50 rounded-full items-center justify-center">
                  <Ionicons name="car" size={24} color="#16a34a" />
                </View>
                <Text className="text-xs font-medium text-gray-600">Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Form Modal */}
      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFormModal(false)}>
        <View className="flex-1 bg-gray-50">
          <View className="bg-white p-4 border-b border-gray-200 flex-row justify-between items-center">
            <Text className="font-bold text-lg">Add {selectedType} Details</Text>
            <TouchableOpacity onPress={() => setShowFormModal(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <ScrollView className="p-5">
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Title</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl p-4 text-gray-900"
                placeholder="e.g. DEL → BOM or Grand Hyatt"
                value={formTitle}
                onChangeText={setFormTitle}
              />
            </View>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Subtitle / Details</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl p-4 text-gray-900"
                placeholder="e.g. Economy or Deluxe Room"
                value={formSubtitle}
                onChangeText={setFormSubtitle}
              />
            </View>
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Estimated Price (₹)</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl p-4 text-gray-900"
                placeholder="0"
                keyboardType="numeric"
                value={formPrice}
                onChangeText={setFormPrice}
              />
            </View>

            <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={handleSaveSegment}>
              <Text className="text-white font-bold text-lg">Add Segment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Helpers
function getSegmentIcon(type: SegmentType) {
  switch (type) {
    case 'FLIGHT':
      return (
        <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center shadow-md shadow-blue-300 border-2 border-white">
          <Ionicons name="airplane" size={20} color="white" />
        </View>
      );
    case 'TRANSFER':
      return (
        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center shadow-md border-2 border-white">
          <Ionicons name="car" size={20} color="#2563eb" />
        </View>
      );
    case 'ACCOMMODATION':
      return (
        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center shadow-md border-2 border-white">
          <Ionicons name="bed" size={20} color="#2563eb" />
        </View>
      );
    default:
      return <View className="w-10 h-10 rounded-full bg-gray-300" />;
  }
}
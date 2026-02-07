import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TripType = "one-way" | "round-trip" | "multi-city";
type TripPurpose = "business" | "tourist";

export default function NewJourney() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [tripPurpose, setTripPurpose] = useState<TripPurpose>("business");
  const [travelers, setTravelers] = useState(2);
  const [sourceCity, setSourceCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSubmit = () => {
    // Navigate to journeys after creating
    router.push("/(agent)/Create/selectjourney");
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getDateRangeText = () => {
    if (!startDate && !endDate) {
      return "Select travel dates";
    }
    if (startDate && !endDate) {
      return formatDate(startDate);
    }
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return "Select travel dates";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ================= HEADER ================= */}
      <View className="bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="text-2xl font-bold text-gray-900">New Journey</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= FORM CONTENT ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Section Title */}
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Trip Details
          </Text>
          <Text className="text-gray-500 mb-6">
            Let's plan your perfect journey
          </Text>

          {/* ===== TRIP TYPE ===== */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Trip Type
            </Text>
            <View className="flex-row gap-3">
              <TripTypeButton
                label="One-way"
                selected={tripType === "one-way"}
                onPress={() => setTripType("one-way")}
              />
              <TripTypeButton
                label="Round-trip"
                selected={tripType === "round-trip"}
                onPress={() => setTripType("round-trip")}
              />
            
            </View>
          </View>

          {/* ===== FROM LOCATION ===== */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              From
            </Text>
            <View className="bg-white rounded-2xl border border-gray-200 flex-row items-center px-4 py-4 shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                <Ionicons name="airplane" size={20} color="#2563eb" />
              </View>
              <TextInput
                placeholder="Source City (e.g. New York)"
                placeholderTextColor="#9ca3af"
                value={sourceCity}
                onChangeText={setSourceCity}
                className="flex-1 text-base text-gray-900 font-medium"
              />
            </View>
          </View>

          {/* Swap Icon */}
          <View className="items-center -my-2 z-10">
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white border-2 border-blue-100 items-center justify-center shadow-md"
              onPress={() => {
                const temp = sourceCity;
                setSourceCity(destinationCity);
                setDestinationCity(temp);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {/* ===== TO LOCATION ===== */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              To
            </Text>
            <View className="bg-white rounded-2xl border border-gray-200 flex-row items-center px-4 py-4 shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3">
                <Ionicons name="location" size={20} color="#dc2626" />
              </View>
              <TextInput
                placeholder="Destination City (e.g. London)"
                placeholderTextColor="#9ca3af"
                value={destinationCity}
                onChangeText={setDestinationCity}
                className="flex-1 text-base text-gray-900 font-medium"
              />
            </View>
          </View>

          {/* ===== TRAVEL DATES ===== */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Travel Dates
            </Text>
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              className="bg-white rounded-2xl border border-gray-200 flex-row items-center justify-between px-4 py-4 shadow-sm"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center mr-3">
                  <Ionicons name="calendar" size={20} color="#7c3aed" />
                </View>
                <Text
                  className={`text-base font-medium ${
                    startDate ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {getDateRangeText()}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* ===== NUMBER OF TRAVELERS ===== */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              No. of Travelers
            </Text>
            <View className="bg-white rounded-2xl border border-gray-200 px-4 py-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    Adults & Children
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Age 2 and above
                  </Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => travelers > 1 && setTravelers(travelers - 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center"
                    disabled={travelers <= 1}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={travelers <= 1 ? "#d1d5db" : "#1f2937"}
                    />
                  </TouchableOpacity>
                  <Text className="text-2xl font-bold text-gray-900 w-8 text-center">
                    {travelers}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTravelers(travelers + 1)}
                    className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center shadow-md"
                  >
                    <Ionicons name="add" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ===== PURPOSE OF TRIP ===== */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Purpose of Trip
            </Text>
            <View className="flex-row gap-3">
              <PurposeButton
                label="Business"
                icon="briefcase"
                selected={tripPurpose === "business"}
                onPress={() => setTripPurpose("business")}
              />
              <PurposeButton
                label="Tourist"
                icon="camera"
                selected={tripPurpose === "tourist"}
                onPress={() => setTripPurpose("tourist")}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= BOTTOM CTA ================= */}
      <View className="bg-white border-t border-gray-100 px-5 py-4">
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          className="overflow-hidden rounded-2xl shadow-lg"
        >
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 px-6"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-lg font-bold mr-2">
                Create Journey
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ================= CALENDAR MODAL ================= */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        startDate={startDate}
        endDate={endDate}
        onSelectStart={setStartDate}
        onSelectEnd={setEndDate}
      />
    </SafeAreaView>
  );
}

/* ================= CALENDAR MODAL COMPONENT ================= */
function CalendarModal({
  visible,
  onClose,
  startDate,
  endDate,
  onSelectStart,
  onSelectEnd,
}: {
  visible: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onSelectStart: (date: Date) => void;
  onSelectEnd: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    if (!startDate || isSelectingEnd) {
      if (!startDate) {
        onSelectStart(date);
        setIsSelectingEnd(true);
      } else {
        if (date < startDate) {
          onSelectStart(date);
          onSelectEnd(startDate);
        } else {
          onSelectEnd(date);
        }
        setIsSelectingEnd(false);
      }
    } else {
      onSelectStart(date);
      onSelectEnd(null as any);
      setIsSelectingEnd(true);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isStartDate = (date: Date) => {
    if (!startDate) return false;
    return date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (date: Date) => {
    if (!endDate) return false;
    return date.toDateString() === endDate.toDateString();
  };

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const handleConfirm = () => {
    setIsSelectingEnd(false);
    onClose();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl">
          {/* Header */}
          <View className="px-5 pt-6 pb-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Select Dates
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#1f2937" />
              </TouchableOpacity>
              
              <Text className="text-lg font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center"
              >
                <Ionicons name="chevron-forward" size={20} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar Grid */}
          <ScrollView className="max-h-96">
            <View className="px-5 py-4">
              {/* Day Labels */}
              <View className="flex-row mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <View key={index} className="flex-1 items-center">
                    <Text className="text-xs font-semibold text-gray-500">
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Dates Grid */}
              <View className="flex-row flex-wrap">
                {days.map((date, index) => {
                  if (!date) {
                    return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
                  }

                  const inRange = isDateInRange(date);
                  const isStart = isStartDate(date);
                  const isEnd = isEndDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <View key={index} className="w-[14.28%] aspect-square p-1">
                      <TouchableOpacity
                        onPress={() => handleDateSelect(date)}
                        className={`flex-1 rounded-xl items-center justify-center ${
                          isStart || isEnd
                            ? "bg-blue-600"
                            : inRange
                            ? "bg-blue-100"
                            : isToday
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            isStart || isEnd
                              ? "text-white"
                              : inRange
                              ? "text-blue-600"
                              : isToday
                              ? "text-blue-600"
                              : "text-gray-900"
                          }`}
                        >
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-gray-100">
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.8}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={["#3b82f6", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4"
              >
                <Text className="text-white text-center text-lg font-bold">
                  Confirm Dates
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================= COMPONENTS ================= */

function TripTypeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
        selected
          ? "bg-blue-50 border-blue-600"
          : "bg-white border-gray-200"
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-center font-semibold ${
          selected ? "text-blue-600" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PurposeButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: any;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1"
      activeOpacity={0.8}
    >
      {selected ? (
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl py-4 px-5 shadow-lg"
        >
          <View className="flex-row items-center justify-center gap-2">
            <View className="bg-white/20 rounded-lg p-1">
              <Ionicons name={icon} size={20} color="#ffffff" />
            </View>
            <Text className="text-white font-bold text-base">{label}</Text>
          </View>
        </LinearGradient>
      ) : (
        <View className="bg-white rounded-2xl py-4 px-5 border border-gray-200 shadow-sm">
          <View className="flex-row items-center justify-center gap-2">
            <View className="bg-gray-100 rounded-lg p-1">
              <Ionicons name={icon} size={20} color="#6b7280" />
            </View>
            <Text className="text-gray-600 font-semibold text-base">
              {label}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}
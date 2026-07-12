import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/context/OnboardingContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const DOBScreen = () => {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  // const { updateOnboardingData } = useOnboarding();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const insets = useSafeAreaInsets();


  const isEighteenOrOlder = (dob: Date | null): boolean => {
    if (!dob) return false;
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

    return age > 18 || (age === 18 && hasHadBirthdayThisYear);
  };

  useEffect(() => {
    if (date) setAgeError(null);
  }, [date]);

  const handleDateChange = (selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      if (!isEighteenOrOlder(selectedDate)) {
        setAgeError("We're sorry, you must be at least 18 years old to use this app.");
      }
    }
  };

  const formattedDate = date
    ? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`
    : "";

 const handleNext = () => {
  if (date && isEighteenOrOlder(date)) {
    updateOnboardingData({ dateOfBirth: date.toISOString() });
    router.push("/gender");
  } else {
    setAgeError("We're sorry, you must be at least 18 years old to use this app.");
  }
};


  const handleBack = () => {
    router.back();
  };

  return (
    
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="bg-primary">
<StatusBar barStyle="light-content" />
      
      <View className="flex-1 px-6 py-8">
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleBack}
          className="w-10 h-10 rounded-full mb-6 flex items-center justify-center"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-12">
          <Text className="text-white text-3xl font-bold">
            When's your birthday?
          </Text>
          <Text className="text-gray-300 mt-2">
            We need to confirm you're at least 18 years old.
          </Text>
        </View>

        {/* Date Picker */}
        <View className="mb-6">
          <TouchableOpacity
            className="bg-[#1F1F1F] px-4 py-5 rounded-xl flex-row items-center justify-between"
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-lg ${formattedDate ? "text-white" : "text-gray-500"}`}
            >
              {formattedDate || "Select your date of birth"}
            </Text>
            <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {ageError && (
            <View className="mt-3 px-1">
              <Text className="text-red-500">{ageError}</Text>
            </View>
          )}
        </View>

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={showPicker}
          mode="date"
          onConfirm={handleDateChange}
          onCancel={() => setShowPicker(false)}
          maximumDate={new Date()}
          minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
          date={date || new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
        />

        {/* Bottom Button */}
        <View className="mt-auto pt-6">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              date ? (isEighteenOrOlder(date) ? "bg-accent" : "bg-gray-700") : "bg-gray-700"
            }`}
            onPress={handleNext}
            disabled={!date || !isEighteenOrOlder(date)}
            activeOpacity={0.8}
          >
            <Text
              className={`text-center font-bold text-lg ${
                date && isEighteenOrOlder(date) ? "text-white" : "text-gray-400"
              }`}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
      
    
  );
};

export default DOBScreen;

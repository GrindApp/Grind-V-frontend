import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from "@/context/OnboardingContext";

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const GenderScreen = () => {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const { onboardingData, updateOnboardingData } = useOnboarding();
  

  const handleNext = () => {
    if (selectedGender) {
      updateOnboardingData({ gender: selectedGender.toLowerCase() });
      console.log("Current Onboarding Data:", onboardingData);
      router.push('/gym_level');
    } else {
      alert('Please select your gender.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
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
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold">
            What's your gender?
          </Text>
          <Text className="text-gray-300 mt-2">
            This helps us personalize your experience
          </Text>
        </View>

        {/* Gender Options */}
        <View className="mb-6 space-y-4">
          {GENDERS.map((gender) => (
            <TouchableOpacity
              key={gender}
              onPress={() => setSelectedGender(gender)}
              activeOpacity={0.7}
              className={`border rounded-xl px-5 py-4 flex-row justify-between items-center ${
                selectedGender === gender 
                  ? 'border-white bg-white/10' 
                  : 'border-gray-700'
              }`}
            >
              <Text
                className={`text-lg font-medium ${
                  selectedGender === gender ? 'text-white' : 'text-gray-300'
                }`}
              >
                {gender}
              </Text>
              
              {selectedGender === gender && (
                <View className="bg-white rounded-full p-1">
                  <Ionicons name="checkmark" size={18} color="#111" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button */}
        <View className="mt-auto pt-6">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              selectedGender ? 'bg-accent' : 'bg-gray-700'
            }`}
            onPress={handleNext}
            disabled={!selectedGender}
            activeOpacity={0.8}
          >
            <Text 
              className={`text-center font-bold text-lg ${
                selectedGender ? 'text-white' : 'text-gray-400'
              }`}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GenderScreen;
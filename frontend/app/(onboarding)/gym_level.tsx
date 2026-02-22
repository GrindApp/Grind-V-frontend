import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/context/OnboardingContext";

const LEVELS = [
  {
    id: "beginner",
    name: "Beginner",
    description: "New to fitness or returning after a long break",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Consistent gym-goer with some experience",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Experienced with proper form and techniques",
  },
];

const GymLevelScreen = () => {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const { onboardingData, updateOnboardingData } = useOnboarding();

  const handleNext = () => {
    if (selectedLevel) {
      updateOnboardingData({ skill_level: selectedLevel });
      console.log("current onboarding data", onboardingData);
      router.push("/tags");
    } else {
      alert("Please select your gym level.");
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
            What's your gym level?
          </Text>
          <Text className="text-gray-300 mt-2">
            This helps us recommend appropriate workouts
          </Text>
        </View>

        {/* Level Options */}
        <View className="mb-6 space-y-4">
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSelectedLevel(level.id)}
              activeOpacity={0.7}
              className={`border rounded-xl p-4 ${
                selectedLevel === level.id
                  ? "border-white bg-white/10"
                  : "border-gray-700"
              }`}
            >
              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-lg font-medium ${
                    selectedLevel === level.id ? "text-white" : "text-gray-300"
                  }`}
                >
                  {level.name}
                </Text>

                {selectedLevel === level.id && (
                  <View className="bg-white rounded-full p-1">
                    <Ionicons name="checkmark" size={18} color="#111" />
                  </View>
                )}
              </View>

              <Text className="text-gray-400 mt-1 text-sm">
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button */}
        <View className="mt-auto pt-6">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              selectedLevel ? "bg-accent" : "bg-gray-700"
            }`}
            onPress={handleNext}
            disabled={!selectedLevel}
            activeOpacity={0.8}
          >
            <Text
              className={`text-center font-bold text-lg ${
                selectedLevel ? "text-white" : "text-gray-400"
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

export default GymLevelScreen;

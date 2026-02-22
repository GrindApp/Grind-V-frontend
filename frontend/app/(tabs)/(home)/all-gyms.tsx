import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FullGymList from "@/app/components/homepage/FullGymList";

const AllGymsPage = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">All Gyms</Text>
        <View className="w-6" />
      </View>

      {/* Full List of Gyms */}
      <FullGymList />
    </SafeAreaView>
  );
};

export default AllGymsPage;

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";

const PrivacySettings = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-zinc-800/80 rounded-full mr-4"
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Privacy</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Section: Account Privacy */}
          <Text className="text-gray-400 text-xs mb-2">ACCOUNT</Text>
          <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="lock" size={18} color="#999999" />
              <Text className="text-white ml-3">Private Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>

          {/* Section: Data & Permissions */}
          <Text className="text-gray-400 text-xs mt-8 mb-2">DATA & PERMISSIONS</Text>

          <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="map-pin" size={18} color="#999999" />
              <Text className="text-white ml-3">Location Access</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="bell-off" size={18} color="#999999" />
              <Text className="text-white ml-3">Ad Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="download" size={18} color="#999999" />
              <Text className="text-white ml-3">Download Your Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>

          {/* Section: Legal */}
          <Text className="text-gray-400 text-xs mt-8 mb-2">LEGAL</Text>

          <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-zinc-800" onPress={() => router.push('/(settings)/PrivacyAndTerms')}>
            <View className="flex-row items-center">
              <Feather name="file-text" size={18} color="#999999" />
              <Text className="text-white ml-3">Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-zinc-800 mb-10"  onPress={() => router.push('/(settings)/TermsNcondtions')}>
            <View className="flex-row items-center">
              <Feather name="shield" size={18} color="#999999" />
              <Text className="text-white ml-3">Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default PrivacySettings;

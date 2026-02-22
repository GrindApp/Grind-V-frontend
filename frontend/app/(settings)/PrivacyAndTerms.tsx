import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const PrivacyPolicy = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-zinc-900 px-6">
      {/* Header */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-zinc-800 rounded-full mr-3"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold">Privacy Policy</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Privacy Policy Content */}
        <Text className="text-white text-base mb-4">
          <Text className="font-semibold">Effective Date: April 30, 2025</Text>
        </Text>
        <Text className="text-white text-base mb-6">
          Welcome to Grind! This Privacy Policy outlines how we collect, use,
          disclose, and safeguard your information when you use our mobile
          application and services.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          1. Information We Collect
        </Text>
        <Text className="text-white text-base mb-4">
          We collect various types of information to enhance your experience,
          including:
        </Text>
        <Text className="text-white text-base mb-4">
          - Personal Information: Name, email address, phone number, date of
          birth, gender, profile photos, etc.
        </Text>
        <Text className="text-white text-base mb-4">
          - Device Information: Device model, OS, unique device identifiers,
          network info.
        </Text>
        <Text className="text-white text-base mb-4">
          - Location Data: Precise geolocation data for location-based features.
        </Text>
        <Text className="text-white text-base mb-4">
          - Usage Data: Interactions with the app, features used, and preferences.
        </Text>
        <Text className="text-white text-base mb-4">
          - Contacts Access: With your permission, we access your contacts for
          friend connections.
        </Text>
        <Text className="text-white text-base mb-4">
          - Camera and Photos: For profile pictures and image sharing.
        </Text>
        <Text className="text-white text-base mb-4">
          - Microphone Access: For audio input in certain features.
        </Text>
        <Text className="text-white text-base mb-4">
          - Health and Fitness Data: With your consent, we may collect health
          data for personalized experiences.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          2. How We Use Your Information
        </Text>
        <Text className="text-white text-base mb-4">
          Your information is used for:
        </Text>
        <Text className="text-white text-base mb-4">
          - Account creation and management.
        </Text>
        <Text className="text-white text-base mb-4">
          - Personalized content and match suggestions.
        </Text>
        <Text className="text-white text-base mb-4">
          - Facilitating communication with other users.
        </Text>
        <Text className="text-white text-base mb-4">
          - Improving services and adding new features.
        </Text>
        <Text className="text-white text-base mb-4">
          - Promotional communications (with your consent).
        </Text>
        <Text className="text-white text-base mb-4">
          - Ensuring safety and security by detecting fraud.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          3. Sharing of Information
        </Text>
        <Text className="text-white text-base mb-4">
          We may share your information with:
        </Text>
        <Text className="text-white text-base mb-4">
          - Service Providers: Third-party vendors assisting us.
        </Text>
        <Text className="text-white text-base mb-4">
          - Affiliates: Companies in our corporate group.
        </Text>
        <Text className="text-white text-base mb-4">
          - Legal Obligations: If required by law or to protect our rights.
        </Text>
        <Text className="text-white text-base mb-4">
          - Business Transfers: In case of a merger or acquisition.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          4. Your Rights and Choices
        </Text>
        <Text className="text-white text-base mb-4">
          You have the right to:
        </Text>
        <Text className="text-white text-base mb-4">
          - Access, update, or delete your personal information.
        </Text>
        <Text className="text-white text-base mb-4">
          - Opt-out of promotional communications.
        </Text>
        <Text className="text-white text-base mb-4">
          - Disable location tracking through your device settings.
        </Text>
        <Text className="text-white text-base mb-4">
          - Withdraw consent for data processing, where applicable.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          5. Data Security
        </Text>
        <Text className="text-white text-base mb-4">
          We take appropriate security measures to protect your information, but
          no system is 100% secure.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          6. Children's Privacy
        </Text>
        <Text className="text-white text-base mb-4">
          Our services are not intended for children under 18. We do not knowingly
          collect data from children.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          7. Changes to This Policy
        </Text>
        <Text className="text-white text-base mb-4">
          We may update this Privacy Policy periodically. Any significant changes
          will be communicated to you.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          8. Contact Us
        </Text>
        <Text className="text-white text-base mb-4">
          For any questions or concerns, please contact us at:
        </Text>
        <Text className="text-white text-base mb-6">
          **Email:** support@grindapp.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;

import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TermsConditions = () => {
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
        <Text className="text-white text-3xl font-bold">Terms & Conditions</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Terms and Conditions Content */}
        <Text className="text-white text-base mb-4">
          <Text className="font-semibold">Effective Date: April 30, 2025</Text>
        </Text>
        <Text className="text-white text-base mb-6">
          Welcome to Grind! These Terms and Conditions ("Terms") govern your use of
          our mobile application and services. By using Grind, you agree to comply
          with these Terms. If you do not agree with these Terms, please do not use
          our services.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          1. Acceptance of Terms
        </Text>
        <Text className="text-white text-base mb-4">
          By using Grind, you acknowledge that you have read and agree to these
          Terms. If you are under 18, you may only use Grind with the consent of a
          parent or guardian.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          2. User Responsibilities
        </Text>
        <Text className="text-white text-base mb-4">
          You are responsible for maintaining the confidentiality of your account
          information and for all activities that occur under your account. You agree
          to use Grind in accordance with applicable laws and not to engage in
          prohibited activities.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          3. Prohibited Content and Behavior
        </Text>
        <Text className="text-white text-base mb-4">
          You may not post, upload, or transmit any content that:
        </Text>
        <Text className="text-white text-base mb-4">
          - Is unlawful, harmful, or defamatory.
        </Text>
        <Text className="text-white text-base mb-4">
          - Violates the privacy or intellectual property rights of others.
        </Text>
        <Text className="text-white text-base mb-4">
          - Contains viruses or harmful software.
        </Text>
        <Text className="text-white text-base mb-4">
          - Harasses or intimidates other users.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          4. Data Privacy and Security
        </Text>
        <Text className="text-white text-base mb-4">
          We value your privacy. Please refer to our Privacy Policy to understand
          how we collect, use, and protect your data.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          5. Termination of Account
        </Text>
        <Text className="text-white text-base mb-4">
          We reserve the right to suspend or terminate your account if you violate
          these Terms, including engaging in prohibited activities or harmful
          behavior.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          6. Disclaimers and Limitation of Liability
        </Text>
        <Text className="text-white text-base mb-4">
          Grind is provided "as is" and we do not warrant the accuracy or
          reliability of any content. We are not responsible for any damages or
          losses resulting from your use of Grind.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          7. Indemnification
        </Text>
        <Text className="text-white text-base mb-4">
          You agree to indemnify and hold harmless Grind, its affiliates, and its
          employees from any claims or damages arising out of your use of the app.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          8. Changes to Terms
        </Text>
        <Text className="text-white text-base mb-4">
          We may update these Terms at any time. You will be notified of any material
          changes, and your continued use of Grind will indicate your acceptance of
          the updated Terms.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          9. Governing Law
        </Text>
        <Text className="text-white text-base mb-4">
          These Terms are governed by the laws of the jurisdiction in which Grind
          operates. Any disputes will be resolved through arbitration or in the courts
          located in that jurisdiction.
        </Text>

        <Text className="text-white text-base mb-6 font-semibold">
          10. Contact Us
        </Text>
        <Text className="text-white text-base mb-4">
          If you have any questions or concerns about these Terms, please contact us
          at:
        </Text>
        <Text className="text-white text-base mb-6">
          **Email:** support@grindapp.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsConditions;

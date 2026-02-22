import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleResetPassword = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    // TODO: Add real password reset logic
    Alert.alert("Success", "Password reset link sent to your email.");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-6">
          {/* Back Button + Title */}
          <View className="flex-row items-center mt-4 mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 bg-zinc-800/80 rounded-full mr-4"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Forgot Password</Text>
          </View>

          {/* Description */}
          <Text className="text-gray-400 text-base mb-6 leading-relaxed">
            Enter your email below and we’ll send you instructions to reset your password.
          </Text>

          {/* Email Label */}
          <Text className="text-gray-400 text-sm font-semibold mb-1">EMAIL</Text>

          {/* Email Input */}
          <View className="flex-row items-center border-b border-zinc-700 pb-2 mb-8">
            <Feather name="mail" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              className="ml-2 text-white flex-1 text-base"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            className="bg-accent py-3 rounded-md"
            onPress={handleResetPassword}
          >
            <Text className="text-white text-center tracking-wider font-semibold">
              RESET PASSWORD
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ForgotPassword;

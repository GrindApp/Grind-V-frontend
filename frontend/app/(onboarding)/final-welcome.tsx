import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOnboarding } from "@/context/OnboardingContext";
import { decodeJWT } from "@/utils/jwt";
import { createProfileFormData } from "@/utils/createProfileFormData";
const API_URL = process.env.EXPO_PUBLIC_API_URL;


const FinalWelcomeScreen = () => {
  const router = useRouter();
  const { onboardingData } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);

  // const handleStart = async () => {
  //   setSubmitting(true);
  //   try {
  //     const token = await AsyncStorage.getItem("authToken");
  //     if (!token) throw new Error("Authentication token missing.");

  //     const decoded = decodeJWT(token);
  //     const userId = decoded?.id || decoded?._id;
  //     if (!userId) throw new Error("Invalid token. User ID not found.");

  //     const formData = createProfileFormData(onboardingData, userId);

  //     const res1 = await fetch("http://192.168.1.10:3000/api/v1/userProfile", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${token}`, // no Content-Type here
  //       },
  //       body: formData,
  //     });

  //     const profileRes = await res1.json();
  //     if (!profileRes.success) {
  //       throw new Error(profileRes.message || "Failed to create profile");
  //     }

  //     const res2 = await fetch("http://192.168.1.10:3000/api/v1/auth/onboarded", {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ onboarded: true }),
  //     });

  //     const onboardRes = await res2.json();
  //     if (!onboardRes.success) {
  //       throw new Error(
  //         onboardRes.message || "Failed to update onboarded status"
  //       );
  //     }

  //     router.replace("/(tabs)/(home)/HomeScreen");
  //   } catch (err: any) {
  //     console.error("Onboarding Submit Error:", err);
  //     Alert.alert("Error", err.message || "Something went wrong");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };
  const handleStart = async () => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Authentication token missing.");

      const decoded = decodeJWT(token);
      const userId = decoded?.id || decoded?._id;
      if (!userId) throw new Error("Invalid token. User ID not found.");

      const formData = createProfileFormData(onboardingData, userId);

      // ✅ Submit profile with FormData
      const res1 = await fetch(`${API_URL}/api/v1/userProfile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Don't add Content-Type manually
        },
        body: formData,
      });

      const rawText = await res1.text();
      console.log("Profile API raw response:", rawText);

      let profileRes;
      try {
        profileRes = JSON.parse(rawText);
      } catch (e) {
        throw new Error(
          `Server returned non-JSON (status ${res1.status}): ${rawText.slice(0, 300)}`
        );
      }

      if (!profileRes.success) {
        throw new Error(profileRes.message || "Failed to create profile");
      }

      // ✅ Patch onboarded status
      const res2 = await fetch(`${API_URL}/api/v1/auth/onboarded`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ onboarded: true }),
      });

      const onboardRes = await res2.json();
      if (!onboardRes.success) {
        throw new Error(
          onboardRes.message || "Failed to update onboarded status"
        );
      }

      // 🎉 Navigate to home
      router.replace("/(tabs)/(home)/HomeScreen");
    } catch (err: any) {
      console.error("Onboarding Submit Error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-primary justify-center items-center px-6">
      <Text className="text-white text-3xl font-bold mb-4 text-center">
        Welcome to{" "}
        <Text className="text-accent text-4xl font-extrabold">GRIND</Text>
      </Text>

      <Text className="text-gray-400 text-center mb-10">
        You’re all set. Let’s start your fitness journey.
      </Text>

      <TouchableOpacity
        onPress={handleStart}
        disabled={submitting}
        className="bg-accent py-3 px-6 rounded-lg w-full"
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-center">
            Start Exploring
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default FinalWelcomeScreen;

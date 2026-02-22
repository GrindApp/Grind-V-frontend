import { Link } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
const API_URL = process.env.EXPO_PUBLIC_API_URL;



export default function Index() {
  const router = useRouter();
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        return router.replace("/login");
      }

      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (json.success) {
        if (json.data.onboarded) {
          router.replace("/(tabs)/(home)/HomeScreen");
        } else {
          router.replace("/(onboarding)/house_rules");
        }
      } else {
        router.replace("/login");
      }
    };

    checkAuthAndOnboarding();
  }, []);

  //   useEffect(() => {
  //   const checkAuth = async () => {
  //     const token = await AsyncStorage.getItem("authToken");
  //     if (token) {
  //       router.replace("/(tabs)/(home)/HomeScreen");
  //     } else {
  //       router.replace("/login");
  //     }
  //   };

  //   checkAuth();
  // }, []);

  return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
  );
}

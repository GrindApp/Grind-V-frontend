import { Link } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
   const router = useRouter();


    useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        router.replace("/(tabs)/(home)/HomeScreen"); 
      } else {
        router.replace("/login"); 
      }
    };

    checkAuth();
  }, []);

   return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#FF3B30" />
    </View>
  );
}
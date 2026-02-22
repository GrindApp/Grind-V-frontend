import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const useLogout = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      Alert.alert("Logged out", "You have been logged out.");
      
      router.replace("/login"); 
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return logout;
};

export default useLogout;

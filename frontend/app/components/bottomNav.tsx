import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;

  return (
    <SafeAreaView className="bg-primary" edges={["bottom"]}>
      <View className="flex-row justify-around items-center py-2 bg-primary">
        {/* Home */}
        <TouchableOpacity
          onPress={() => router.push("/HomeScreen")}
          className="items-center"
        >
          <Ionicons
            name="home-outline"
            size={22}
            color={isActive("/HomeScreen") ? "#FF3B30" : "#D1D1D6"}
          />
          <Text
            className={`text-xs mt-1 ${isActive("/HomeScreen") ? "text-accent" : "text-gray-400"}`}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Gym Buddy */}
        <TouchableOpacity
          onPress={() => router.push("/gymBuddy")}
          className="items-center"
        >
          <Ionicons
            name="people-outline"
            size={22}
            color={isActive("/gymBuddy") ? "#FF3B30" : "#D1D1D6"}
          />
          <Text
            className={`text-xs mt-1 ${isActive("/gymBuddy") ? "text-accent" : "text-gray-400"}`}
          >
            Gym Buddy
          </Text>
        </TouchableOpacity>

        {/* Search */}
        <TouchableOpacity
          onPress={() => router.push("/exercises")}
          className="items-center"
        >
          <Feather
            name="search"
            size={22}
            color={isActive("/exercises") ? "#FF3B30" : "#D1D1D6"}
          />
          <Text
            className={`text-xs mt-1 ${isActive("/exercises") ? "text-accent" : "text-gray-400"}`}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/fitness-dasboard")}
          className="items-center"
        >
          <Feather
            name="book"
            size={22}
            color={isActive("/fitness-dasboard") ? "#FF3B30" : "#D1D1D6"}
          />
          <Text
            className={`text-xs mt-1 ${isActive("/fitness-dasboard") ? "text-accent" : "text-gray-400"}`}
          >
            My Lore
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BottomNav;

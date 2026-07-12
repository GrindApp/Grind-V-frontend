import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_URL = process.env.EXPO_PUBLIC_API_URL;


type SidebarProps = {
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const router = useRouter();
  const screenHeight = Dimensions.get("window").height;

  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No token found");

      const response = await fetch(`${API_URL}/api/v1/friends/requests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`Failed to fetch requests: ${response.status}`);

      const result = await response.json();
      setPendingCount(result.data.length); // assuming `data` is an array of requests
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const menuItems = [
    {
      icon: <Ionicons name="person-outline" size={24} color="#E0E0E0" />,
      title: "My Profile",
      onPress: () => router.push("/(settings)/EditProfileScreen"),
    },
    {
      icon: (
        <View>
          <Ionicons name="people-outline" size={24} color="#E0E0E0" />
          {pendingCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "red",
                borderRadius: 10,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
              >
                {pendingCount}
              </Text>
            </View>
          )}
        </View>
      ),
      title: "Gym Buddies",
      onPress: () => router.push("/(settings)/gymbuddyScreen"),
    },
    {
      icon: <Ionicons name="bookmark-outline" size={24} color="#E0E0E0" />,
      title: "My OG Collection",
      onPress: () => router.push("/(settings)/savedGym"),
    },
    {
      icon: <Ionicons name="settings-outline" size={24} color="#E0E0E0" />,
      title: "Settings",
      onPress: () => router.push("/(settings)/userSettings"),
    },
    {
      icon: <Feather name="help-circle" size={24} color="#E0E0E0" />,
      title: "Need Help",
      onPress: () => router.push("/(settings)/QueryScreen"),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { height: screenHeight }]}>
      <View style={styles.content}>
        {/* Header with Logo & Close */}
        <View style={styles.header}>
          <Text style={styles.logo}>GRIND</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#E0E0E0" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Menu Items */}
        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                {item.icon}
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© GRIND ASSOCIATION 2024</Text>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1C1C1E",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1000,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E0E0E0",
    letterSpacing: 1.5,
  },
  closeButton: {
    padding: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 10,
  },
  menuContainer: {
    marginTop: 15,
    flex: 1,
  },
  menuItem: {
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    flex: 1,
    marginLeft: 20,
    fontSize: 16,
    color: "#E0E0E0",
    fontWeight: "500",
  },
  footer: {
    marginTop: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#333333",
    alignItems: "center",
  },
  footerText: {
    color: "#8E8E93",
    fontSize: 12,
  },
});

export default Sidebar;

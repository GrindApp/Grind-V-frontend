import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import useLogout from "../(auth)/logout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

type SidebarProps = {
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();
  const screenHeight = Dimensions.get("window").height;
  const logout = useLogout();

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

  const handleLogout = () => {
    // Implement your logout logic here
    setLogoutModalVisible(false);
    // After logout, you may want to navigate to login screen
    router.push("/(auth)/login");
  };

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

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={() => setLogoutModalVisible(true)}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© GRIND ASSOCIATION 2024</Text>
        </View>

        {/* Logout Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={logoutModalVisible}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Logout Confirmation</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to log out?
              </Text>

              <View style={styles.modalButtons}>
                <Pressable
                  className="bg-gray-200 px-4 py-2 rounded-md"
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text>Cancel</Text>
                </Pressable>

                <Pressable
                  className="bg-red-500 px-4 py-2 rounded-md"
                  onPress={() => {
                    setLogoutModalVisible(false);
                    logout();
                  }}
                >
                  <Text className="text-white">Log Out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    marginLeft: 20,
    fontSize: 16,
    color: "#E0E0E0",
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 20,
  },
  logoutText: {
    marginLeft: 20,
    fontSize: 16,
    color: "#FF3B30",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E0E0E0",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#3A3A3C",
  },
  cancelButtonText: {
    color: "#E0E0E0",
    fontWeight: "500",
  },
  logoutConfirmButton: {
    backgroundColor: "#FF3B30",
  },
  logoutConfirmText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default Sidebar;

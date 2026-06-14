import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
// import {
//   Swipeable,
//   GestureHandlerRootView,
// } from "react-native-gesture-handler";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Easing } from "react-native";
import { router } from "expo-router";
import { decodeJWT } from "@/utils/jwt";
const API_URL = process.env.EXPO_PUBLIC_API_URL;


type TabType = "requests" | "added" | "blocked";

const { height, width } = Dimensions.get("window");

const GymBuddyScreen = () => {
  interface Buddy {
    id: string;
    name: string;
    image: string;
    status: string;
  }

  const [buddies, setBuddies] = useState<{
    requests: Buddy[];
    added: Buddy[];
    blocked: Buddy[];
  }>({
    requests: [],
    added: [],
    blocked: [],
  });

  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);

  // Custom animated bottom sheet
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Swipe hint animation
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const swipeHintOpacity = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  interface Buddy {
    id: string; // friendship ID
    otherUserId: string; // required for backend
    name: string;
    image: string;
    status: string;
  }

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const decoded = decodeJWT(token);
      console.log("User ID:", decoded?.id || decoded?._id);

      const response = await fetch(`${API_URL}/api/v1/friends/requests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("PENDING REQUESTS:", JSON.stringify(result, null, 2));

      // Assuming the API returns an array of requests or an object with requests array
      const requests = result.data.map((req: any) => ({
        id: req._id,
        otherUserId: req.user1._id, // send this to backend
        name: `${req.user1.firstName} ${req.user1.lastName}`,
        image: req.user1.imageUrl[0],
        status: req.status,
      }));

      console.log("Transformed Requests:", requests);

      setBuddies((prev) => ({
        ...prev,
        requests,
      }));
    } catch (error: Error | any) {
      console.error("Error fetching pending requests:", error);
      Alert.alert(
        "Error",
        `Failed to fetch pending requests: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchAddedBuddies = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No token found");

      const decoded = decodeJWT(token);
      const currentUserId = decoded?.id || decoded?._id;

      const response = await fetch(
        `${API_URL}/api/v1/friends/list-friends`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`Failed to fetch friends: ${response.status}`);
      const result = await response.json();

      const transformed = result.data.map((friendship: any) => {
        const otherUser =
          friendship.user1._id === currentUserId
            ? friendship.user2
            : friendship.user1;

        return {
          id: friendship._id,
          otherUserId: otherUser._id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          image: otherUser.imageUrl[0],
          status: friendship.status,
        };
      });

      setBuddies((prev) => ({ ...prev, added: transformed }));
    } catch (error) {
      console.error("Error fetching added buddies:", error);
    }
  };

  // const fetchBlockedBuddies = async () => {
  //   const response = await fetch(
  //     `${API_URL}/api/v1/friends/blocked`
  //   );
  //   const result = await response.json();

  //   const transformed = result.data.map((blocked: any) => ({
  //     id: blocked._id,
  //     name: `${blocked.user1.firstName} ${blocked.user1.lastName}`,
  //     image: blocked.user1.imageUrl[0],
  //     status: blocked.status,
  //   }));

  //   setBuddies((prev) => ({ ...prev, blocked: transformed }));
  // };

  // Initial data fetch
  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([
        fetchPendingRequests(),
        fetchAddedBuddies(),
        // fetchBlockedBuddies(),
      ]);
    };
    fetchAll();
  }, []);

  const updateRequestStatus = async (
    otherUserId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No token found");

      const endpoint =
        status === "accepted" ? "accept-request" : "delete-friendship"; // assuming rejection = delete

      const response = await fetch(`${API_URL}/api/v1/friends/${endpoint}`, {
        method: "PATCH", // or DELETE for rejection if backend requires
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otherUserId }),
      });

      if (!response.ok)
        throw new Error(`Failed to update request: ${response.status}`);

      // Update state locally
      setBuddies((prev) => {
        const updatedRequests = prev.requests.filter(
          (req) => req.otherUserId !== otherUserId
        );
        const updatedBuddies =
          status === "accepted"
            ? [
                ...prev.added,
                prev.requests.find((req) => req.otherUserId === otherUserId)!,
              ]
            : prev.added;

        return { ...prev, requests: updatedRequests, added: updatedBuddies };
      });
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const resetSwipeHint = async () => {
    try {
      await AsyncStorage.removeItem("hasSeenSwipeHint");
      console.log("Swipe hint reset.");
    } catch (error) {
      console.error("Failed to reset swipe hint:", error);
    }
  };

  // Check if user has seen the swipe hint before
  useEffect(() => {
    const checkHintStatus = async () => {
      try {
        const hasSeenHint = await AsyncStorage.getItem("hasSeenSwipeHint");
        if (activeTab === "added" && buddies.added.length > 0 && !hasSeenHint) {
          setTimeout(() => {
            setShowSwipeHint(true);
            fadeInSwipeHint();
            animateSwipeHint();

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              dismissSwipeHint();
            }, 5000);
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking hint status:", error);
      }
    };

    checkHintStatus();
    resetSwipeHint();
  }, [activeTab]);

  const fadeInSwipeHint = () => {
    Animated.timing(swipeHintOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const animateSwipeHint = () => {
    Animated.sequence([
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(swipeAnim, {
        toValue: -40,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Repeat the animation once more
      setTimeout(() => {
        animateSwipeHint();
      }, 1500);
    });
  };

  const dismissSwipeHint = async () => {
    Animated.timing(swipeHintOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowSwipeHint(false);
    });

    try {
      await AsyncStorage.setItem("hasSeenSwipeHint", "true");
    } catch (error) {
      console.error("Error saving hint status:", error);
    }
  };

  // Animate content when tab changes
  useEffect(() => {
    // Reset opacity
    fadeAnim.setValue(0);
    // Animate to full opacity
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const openBottomSheet = useCallback(
    (buddy: Buddy) => {
      setSelectedBuddy(buddy);
      setShowModal(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 10,
      }).start();
    },
    [slideAnim]
  );

  const closeBottomSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
  }, [slideAnim, height]);

  const BuddyCard = ({ item }: { item: Buddy }) => {
    return (
      <View className="bg-zinc-800 p-4 rounded-xl mb-4">
        {/* Top Section: Image + Name */}
        <View className="flex-row items-center">
          <Image
            source={{ uri: item.image }}
            className="w-12 h-12 rounded-full mr-4"
          />
          <View>
            <Text className="text-white text-lg font-semibold">
              {item.name}
            </Text>
            <Text className="text-zinc-400 text-sm">{item.status}</Text>
          </View>
        </View>

        {/* Show Accept/Reject buttons only for pending requests */}
        {item.status === "pending" && (
          <View className="flex-row mt-3">
            <TouchableOpacity
              className="flex-1 bg-green-600/20 border border-green-500/30 rounded-lg p-2 mr-2 items-center"
              onPress={() => updateRequestStatus(item.otherUserId, "accepted")}
            >
              <Text className="text-green-400 font-medium">Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-red-600/20 border border-red-500/30 rounded-lg p-2 items-center"
              onPress={() => updateRequestStatus(item.otherUserId, "rejected")}
            >
              <Text className="text-red-400 font-medium">Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const EmptyState = () => {
    let icon, title, message;

    if (activeTab === "requests") {
      icon = "account-clock";
      title = "No pending requests";
      message = "Check back later for new gym buddy requests";
    } else if (activeTab === "added") {
      icon = "account-group";
      title = "No buddies added yet";
      message = "Start accepting requests to build your fitness network";
    } else {
      icon = "account-cancel";
      title = "No blocked users";
      message = "Your blocked users list is empty";
    }

    return (
      <View className="flex-1 justify-center items-center px-6 py-20">
        <MaterialCommunityIcons name={icon} size={60} color="#52525b" />
        <Text className="text-zinc-400 text-lg font-medium mt-4 text-center">
          {title}
        </Text>
        <Text className="text-zinc-500 text-sm mt-2 text-center">
          {message}
        </Text>
      </View>
    );
  };

  // Custom tab bar item
  const TabItem = ({
    tab,
    label,
    count,
    icon,
  }: {
    tab: TabType;
    label: string;
    count: number;
    icon: string;
  }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-2.5 rounded-lg items-center ${
        activeTab === tab
          ? tab === "blocked"
            ? "bg-red-900/40"
            : "bg-zinc-700"
          : ""
      }`}
    >
      <View className="flex-row items-center">
        <MaterialIcons
          name={icon as "account-cancel" | "account-clock" | "account-group"}
          size={16}
          color={activeTab === tab ? "#ffffff" : "#9ca3af"}
        />
        <Text
          className={`${
            activeTab === tab ? "text-white font-semibold" : "text-zinc-400"
          } text-sm ml-1.5`}
        >
          {`${label} (${count})`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-900">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#18181b", "#09090b"]}
        className="absolute inset-0"
      />
      <View className="flex-1">
        <View className="px-4 pt-2">
          <View className="flex-row items-center mb-6 space-x-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 bg-zinc-800/80 rounded-full"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-2xl font-bold"> Buddies</Text>
          </View>

          {/* Enhanced Tab Bar */}
          <View className="bg-zinc-800 rounded-xl p-1.5 mb-6">
            <View className="flex-row">
              <TabItem
                tab="requests"
                label="Requests"
                count={buddies.requests.length}
                icon="person-add"
              />
              <TabItem
                tab="added"
                label="Buddies"
                count={buddies.added.length}
                icon="people"
              />
              {/* <TabItem
                tab="blocked"
                label="Blocked"
                count={buddies.blocked.length}
                icon="block"
              /> */}
            </View>
          </View>
        </View>

        <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
          <FlatList
            data={
              activeTab === "requests"
                ? buddies.requests
                : activeTab === "added"
                ? buddies.added
                : buddies.blocked
            }
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BuddyCard item={item} />}
            className="px-4"
            contentContainerClassName="pb-8"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={EmptyState}
          />
        </Animated.View>

        {/* Swipe Hint */}
        {showSwipeHint && activeTab === "added" && buddies.added.length > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 80,
              left: 0,
              right: 0,
              alignItems: "center",
              opacity: swipeHintOpacity,
            }}
          >
            <Animated.View
              style={{
                transform: [{ translateX: swipeAnim }],
                backgroundColor: "rgba(39, 39, 42, 0.9)",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(113, 113, 122, 0.3)",
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <MaterialCommunityIcons
                name="gesture-swipe-left"
                size={20}
                color="#f43f5e"
              />
              <Text
                style={{
                  color: "#fff",
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Swipe left on a buddy for more options
              </Text>
              <TouchableOpacity
                onPress={dismissSwipeHint}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeBottomSheet}
        >
          <TouchableWithoutFeedback onPress={closeBottomSheet}>
            <View className="flex-1 bg-black/50 justify-end">
              <TouchableWithoutFeedback>
                <Animated.View
                  className="bg-zinc-900 rounded-t-3xl overflow-hidden"
                  style={{
                    transform: [{ translateY: slideAnim }],
                    shadowColor: "#000",
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: -5 },
                    elevation: 10,
                  }}
                >
                  <View className="px-6 pt-4 pb-8">
                    {/* Handle indicator */}
                    <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mb-6" />

                    {selectedBuddy?.status === "pending" && (
                      <>
                        <TouchableOpacity
                          className="mb-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex-row items-center"
                          onPress={() => {
                            updateRequestStatus(selectedBuddy.id, "accepted");
                            closeBottomSheet();
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color="#22c55e"
                          />
                          <Text className="text-green-400 text-base font-medium ml-3">
                            Accept Request
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="mb-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex-row items-center"
                          onPress={() => {
                            updateRequestStatus(selectedBuddy.id, "rejected");
                            closeBottomSheet();
                          }}
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={20}
                            color="#f87171"
                          />
                          <Text className="text-red-400 text-base font-medium ml-3">
                            Reject Request
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default GymBuddyScreen;

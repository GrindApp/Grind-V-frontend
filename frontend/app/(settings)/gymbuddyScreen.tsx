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
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Easing } from "react-native";
import { router } from "expo-router";
import { decodeJWT } from "@/utils/jwt";

interface Buddy {
  id: string;
  name: string;
  message: string;
  image: string;
  status: string;
  lastWorkout?: string;
  blockedDate?: string;
}

type TabType = "requests" | "added" | "blocked";

const initialData = {
  requests: [
    {
      id: "1",
      name: "Rajesh Shukla",
      message: "Looking for a workout partner this week",
      image: "https://i.pravatar.cc/300?img=11",
      status: "Online",
      lastWorkout: "Chest Day",
    },
  ],
  added: [
    {
      id: "2",
      name: "Neha Kapoor",
      message: "Let's hit the new CrossFit class tomorrow!",
      image: "https://i.pravatar.cc/300?img=20",
      status: "Online",
      lastWorkout: "HIIT",
    },
    {
      id: "3",
      name: "Arjun Mehta",
      message: "Great workout yesterday! Same time next week?",
      image: "https://i.pravatar.cc/300?img=12",
      status: "Last seen 2h ago",
      lastWorkout: "Leg Day",
    },
  ],
  blocked: [
    {
      id: "4",
      name: "Rohit Sharma",
      message: "Blocked for inappropriate messages",
      image: "https://i.pravatar.cc/300?img=33",
      status: "Blocked",
      blockedDate: "Apr 15, 2025",
    },
    {
      id: "5",
      name: "Priya Malhotra",
      message: "Blocked for spam invitations",
      image: "https://i.pravatar.cc/300?img=44",
      status: "Blocked",
      blockedDate: "Apr 22, 2025",
    },
  ],
};

const { height, width } = Dimensions.get("window");

const GymBuddyScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [buddies, setBuddies] = useState(initialData);
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

  const handleAccept = useCallback((buddy: Buddy) => {
    console.log(`Accepted ${buddy.name}`);
    // Move the buddy from requests to added
    setBuddies((prev) => ({
      ...prev,
      requests: prev.requests.filter((r) => r.id !== buddy.id),
      added: [...prev.added, buddy],
    }));
  }, []);

  const handleReject = useCallback((buddy: Buddy) => {
    setBuddies((prev) => ({
      ...prev,
      requests: prev.requests.filter((r) => r.id !== buddy.id),
    }));
  }, []);

  const handleRemove = useCallback(() => {
    if (selectedBuddy) {
      setBuddies((prev) => ({
        ...prev,
        added: prev.added.filter((b) => b.id !== selectedBuddy.id),
      }));
      closeBottomSheet();
    }
  }, [selectedBuddy, closeBottomSheet]);

  const handleBlock = useCallback(() => {
    if (selectedBuddy) {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const blockedBuddy = {
        ...selectedBuddy,
        status: "Blocked",
        blockedDate: formattedDate,
      };

      setBuddies((prev) => ({
        ...prev,
        added: prev.added.filter((b) => b.id !== selectedBuddy.id),
        blocked: [...prev.blocked, blockedBuddy],
      }));

      closeBottomSheet();
    }
  }, [selectedBuddy, closeBottomSheet]);

  const handleUnblock = useCallback((buddy: Buddy) => {
    setBuddies((prev) => ({
      ...prev,
      blocked: prev.blocked.filter((b) => b.id !== buddy.id),
    }));
  }, []);

  const renderRightActions = useCallback(
    (buddy: Buddy) => (
      <View className="flex-row items-center h-full pr-3">
        <TouchableOpacity
          onPress={() => openBottomSheet(buddy)}
          className="w-12 h-12 rounded-full bg-zinc-700/80 justify-center items-center backdrop-blur-md shadow-lg border border-zinc-600/30"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#f1f5f9" />
        </TouchableOpacity>
      </View>
    ),
    [openBottomSheet]
  );

  const BuddyCard = useCallback(
    ({ item }: { item: Buddy }) => {
      const isOnline = item.status === "Online";
      const isBlocked = activeTab === "blocked";
  
      // Enhanced UserDetails component with improved layout
      const UserDetails = () => (
        <View className="flex-row items-start space-x-4 flex-1">
          {/* Profile image with status indicators */}
          <View className="relative">
            <Image
              source={{ uri: item.image }}
              className={`w-16 h-16 rounded-full border-2 mr-2   ${
                isBlocked ? "border-red-800/50 opacity-80" : "border-zinc-700"
              }`}
            />
            
            {/* Online status indicator */}
            {!isBlocked && isOnline && (
              <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 mr-2 border-zinc-900" />
            )}
            
            {/* Blocked indicator */}
            {isBlocked && (
              <View className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border border-zinc-900 items-center justify-center">
                <Ionicons name="ban-outline" size={14} color="#ffffff" />
              </View>
            )}
          </View>
          
          {/* User info section */}
          <View className="flex-1 pt-1">
            {/* Name and status row */}
            <View className="flex-row justify-between items-center mb-1 ml-2">
              <Text className="text-white font-semibold text-lg">
                {item.name}
              </Text>
              {!isOnline && item.status && !isBlocked && (
                <Text className="text-zinc-400 text-xs">
                  {item.status}
                </Text>
              )}
              {/* {isBlocked && item.blockedDate && (
                <Text className="text-red-400/80 text-xs font-medium">
                  {item.blockedDate}
                </Text>
              )} */}
            </View>
            
            {/* Message text with proper styling */}
            <Text
              numberOfLines={2}
              className={`${
                isBlocked ? "text-zinc-500" : "text-zinc-300"
              } text-sm`}
            >
              {item.message}
            </Text>
            
            {/* Workout info with improved icon alignment */}
            {!isBlocked && item.lastWorkout && (
              <View className="flex-row items-center mt-2">
                {/* <View className="bg-zinc-700/50 rounded-full p-1 mr-2">
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={12}
                    color="#9CA3AF"
                  />
                </View>
                <Text className="text-zinc-400 text-xs">
                  {item.lastWorkout}
                </Text> */}
              </View>
            )}
          </View>
        </View>
      );
  
      // Enhanced card wrapper with proper shadow handling in NativeWind
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <View
          className={`${
            isBlocked ? "bg-zinc-800/70" : "bg-zinc-800/90"
          } mx-3 mb-3 px-4 py-4 rounded-2xl border ${
            isBlocked ? "border-red-900/30" : "border-zinc-700/40"
          }`}
          style={{
           
           
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
          }}
        >
          {children}
        </View>
      );
  
      if (isBlocked) {
        // Improved blocked user card
        return (
          <Wrapper>
            <View className="flex-row items-center justify-between">
              <UserDetails />
              <TouchableOpacity
                onPress={() => handleUnblock(item)}
                className="bg-zinc-700/90 px-4 py-2 rounded-xl justify-center items-center ml-2"
                // style={{
                //   shadowOpacity: 0.2,
                //   shadowRadius: 4,
                //   shadowOffset: { width: 0, height: 2 },
                // }}
              >
                <Text className="text-green-400 text-sm font-medium">
                  Unblock
                </Text>
              </TouchableOpacity>
            </View>
          </Wrapper>
        );
      } else if (activeTab === "added") {
        // Enhanced added buddies card with swipe action
        return (
          <Swipeable
            ref={(ref) => (swipeableRefs.current[item.id] = ref)}
            renderRightActions={() => renderRightActions(item)}
            friction={2}
            rightThreshold={40}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => console.log("Message", item.name)}
            >
              <Wrapper>
                <UserDetails />
              </Wrapper>
            </TouchableOpacity>
          </Swipeable>
        );
      } else {
        // Improved request card with accept/reject buttons
        return (
          <Wrapper>
            <View className="flex-row items-center justify-between">
              <UserDetails />
              <View className="flex-row space-x-3 ml-2">
                <TouchableOpacity
                  onPress={() => handleReject(item)}
                  className="bg-zinc-700/90 w-12 mr-2 h-12 rounded-full justify-center items-center"
                  style={{
                   
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Ionicons name="close" size={22} color="#FF4040" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAccept(item)}
                  className="bg-zinc-700/90 w-12 h-12 rounded-full justify-center items-center"
                  style={{
                    
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <Ionicons name="checkmark" size={22} color="#34D399" />
                </TouchableOpacity>
              </View>
            </View>
          </Wrapper>
        );
      }
    },
    [activeTab, handleAccept, handleReject, renderRightActions, handleUnblock]
  );

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
          name={icon as 'account-cancel' | 'account-clock' | 'account-group'}
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
      <GestureHandlerRootView className="flex-1">
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
              <TabItem
                tab="blocked"
                label="Blocked"
                count={buddies.blocked.length}
                icon="block"
              />
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

                    {selectedBuddy && (
                      <>
                        <View className="items-center mb-6">
                          <Image
                            source={{ uri: selectedBuddy.image }}
                            className="w-20 h-20 rounded-full border-2 border-zinc-700 mb-3"
                          />
                          <Text className="text-white text-xl font-bold">
                            {selectedBuddy.name}
                          </Text>
                          <Text className="text-zinc-400 text-sm mt-1">
                            {selectedBuddy.status}
                          </Text>
                        </View>

                        <TouchableOpacity
                          className="mb-3 p-4 rounded-xl bg-zinc-800 border border-zinc-700 flex-row items-center"
                          onPress={() => {
                            console.log("Message", selectedBuddy.name);
                            closeBottomSheet();
                          }}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={20}
                            color="#f1f5f9"
                          />
                          <Text className="text-white text-base font-medium ml-3">
                            Message
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="mb-3 p-4 rounded-xl bg-zinc-800 border border-zinc-700 flex-row items-center"
                          onPress={() => {
                            console.log("View Profile of", selectedBuddy.name);
                            closeBottomSheet();
                          }}
                        >
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color="#f1f5f9"
                          />
                          <Text className="text-white text-base font-medium ml-3">
                            View Profile
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="mb-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex-row items-center"
                          onPress={handleBlock}
                        >
                          <Ionicons
                            name="ban-outline"
                            size={20}
                            color="#f87171"
                          />
                          <Text className="text-red-400 text-base font-medium ml-3">
                            Block User
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="p-4 rounded-xl bg-red-600/10 border border-red-600/30 flex-row items-center"
                          onPress={handleRemove}
                        >
                          <Ionicons
                            name="person-remove-outline"
                            size={20}
                            color="#ef4444"
                          />
                          <Text className="text-red-500 text-base font-medium ml-3">
                            Remove Friend
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="mt-6 p-3 items-center"
                          onPress={closeBottomSheet}
                        >
                          <Text className="text-zinc-400 text-base">
                            Cancel
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
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default GymBuddyScreen;

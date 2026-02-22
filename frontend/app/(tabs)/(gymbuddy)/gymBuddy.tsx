import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width, height } = Dimensions.get("window");

type GymBuddy = {
  id: string;
  user: string;
  name: string;
  age: number;
  distance: string;
  bio: string;
  image: string;
  points: number;
  tags: string[];
};

const GymBuddyScreen = () => {
  const [gymBuddies, setGymBuddies] = useState<GymBuddy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<any>(null);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchGymBuddies();
  }, []);

  const fetchGymBuddies = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");

      const response = await fetch(
        `${API_URL}/api/v1/user-profile?page=1&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch profiles.");

      const result = await response.json();
      const profiles = result.data || [];

      const transformed = profiles.map((p: any) => ({
        id: p._id,
        user: p.user,
        name: p.firstName || "Unknown",
        age: new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
        distance: `${Math.floor(Math.random() * 10) + 1} km`,
        bio: p.bio || "Let's work out together!",
        image: p.imageUrl?.[0] || "https://via.placeholder.com/400",
        tags: p.interests
          ?.slice(0, 3)
          .map((interest: any) => interest.name) || ["Fitness"],
      }));

      setGymBuddies(transformed);
    } catch (error) {
      console.error("Error fetching gym buddies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    const swipedUser = gymBuddies[currentIndex];
    if (!swipedUser) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");

      const decoded = decodeJWT(token);
      const swiperId = decoded?.id || decoded?._id;

      // Save swipe
      await fetch(`${API_URL}/api/v1/swipeUser/swipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          swiperId,
          swipedId: swipedUser.id,
          direction,
        }),
      });

      // Send friend request if right swipe
      if (direction === "right") {
        await fetch(`${API_URL}/api/v1/friends/send-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId: swipedUser.user,
          }),
        });
      }

      // Move to next card
      setCurrentIndex((prev) => prev + 1);
      carouselRef.current?.next();
    } catch (error) {
      console.error("Swipe API Error:", error);
    }
  };

  const renderCard = ({ item }: { item: GymBuddy }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <LinearGradient
        colors={["transparent", "#000"]}
        style={styles.gradient}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name}>
          {item.name}, {item.age}
        </Text>
        <Text style={styles.distance}>{item.distance} away</Text>
        <Text style={styles.bio}>{item.bio}</Text>
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading gym buddies...</Text>
      </View>
    );
  }

  if (gymBuddies.length === 0 || currentIndex >= gymBuddies.length) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.outOfCardsText}>No more buddies to show!</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Carousel
        ref={carouselRef}
        width={width}
        height={height * 0.75}
        data={gymBuddies}
        renderItem={renderCard}
        enabled={false} // Disable default swipe, use buttons
        onSnapToItem={(index) => setCurrentIndex(index)}
      />

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => handleSwipe("left")}
          style={styles.nopeButton}
        >
          <Ionicons name="close-circle" size={64} color="#ff6b6b" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSwipe("right")}
          style={styles.likeButton}
        >
          <Ionicons name="heart-circle" size={64} color="#4cd137" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

export default GymBuddyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    height: "100%",
    width: width - 40,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1e1e1e",
  },
  image: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    height: "100%",
    width: "100%",
    bottom: 0,
  },
  cardContent: {
    position: "absolute",
    bottom: 30,
    left: 20,
  },
  name: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  distance: {
    color: "#ddd",
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: "#ccc",
    marginTop: 10,
    fontSize: 14,
    maxWidth: width * 0.8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 5,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
  },
  buttonsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    zIndex: 10,
  },
  nopeButton: {
    backgroundColor: "transparent",
  },
  likeButton: {
    backgroundColor: "transparent",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
  },
  outOfCardsText: {
    color: "#fff",
    fontSize: 18,
  },
});

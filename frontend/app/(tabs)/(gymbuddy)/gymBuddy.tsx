import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { decodeJWT } from "@/utils/jwt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.3;

type GymBuddy = {
  id: string;
  user: string;
  name: string;
  age: number;
  distance: string;
  bio: string;
  image: string;
  tags: string[];
};

// ─── Single Card ──────────────────────────────────────────────────────────────
export type SwipeCardRef = {
  swipeLeft: () => void;
  swipeRight: () => void;
};

const SwipeCard = React.forwardRef<
  SwipeCardRef,
  {
    buddy: GymBuddy;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
    stackIndex: number;
  }
>(({ buddy, onSwipe, isTop, stackIndex }, ref) => {
  const position = useRef(new Animated.ValueXY()).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;
  const isTopRef = useRef(isTop);
  isTopRef.current = isTop;

  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  // Expose swipeLeft / swipeRight to parent via ref
  React.useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      nopeOpacity.setValue(1);
      Animated.timing(position, {
        toValue: { x: -width * 1.5, y: 0 },
        duration: 350,
        useNativeDriver: true,
      }).start(() => onSwipe("left"));
    },
    swipeRight: () => {
      likeOpacity.setValue(1);
      Animated.timing(position, {
        toValue: { x: width * 1.5, y: 0 },
        duration: 350,
        useNativeDriver: true,
      }).start(() => onSwipe("right"));
    },
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTopRef.current,
      onMoveShouldSetPanResponder: () => isTopRef.current,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
        if (gesture.dx > 0) {
          likeOpacity.setValue(Math.min(gesture.dx / SWIPE_THRESHOLD, 1));
          nopeOpacity.setValue(0);
        } else {
          nopeOpacity.setValue(Math.min(-gesture.dx / SWIPE_THRESHOLD, 1));
          likeOpacity.setValue(0);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: width * 1.5, y: gesture.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(() => onSwipe("right"));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -width * 1.5, y: gesture.dy },
            duration: 250,
            useNativeDriver: true,
          }).start(() => onSwipe("left"));
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          Animated.timing(likeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          Animated.timing(nopeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const cardScale = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.96 : 0.92;
  const cardTranslateY = stackIndex === 0 ? 0 : stackIndex === 1 ? 10 : 20;

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        styles.card,
        {
          transform: isTop
            ? [{ translateX: position.x }, { translateY: position.y }, { rotate }]
            : [{ scale: cardScale }, { translateY: cardTranslateY }],
        },
      ]}
    >
      <Image source={{ uri: buddy.image }} style={styles.image} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.9)"]}
        style={styles.gradient}
      />

      <Animated.View style={[styles.overlayBadge, styles.likeBadge, { opacity: likeOpacity }]}>
        <Text style={styles.likeBadgeText}>LIKE</Text>
      </Animated.View>

      <Animated.View style={[styles.overlayBadge, styles.nopeBadge, { opacity: nopeOpacity }]}>
        <Text style={styles.nopeBadgeText}>NOPE</Text>
      </Animated.View>

      <View style={styles.cardContent}>
        <Text style={styles.name}>{buddy.name}, {buddy.age}</Text>
        <Text style={styles.distance}>{buddy.distance} away</Text>
        <Text style={styles.bio} numberOfLines={2}>{buddy.bio}</Text>
        <View style={styles.tagsContainer}>
          {buddy.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SWIPED_IDS_KEY = "gymbuddy_swiped_ids";

const GymBuddyScreen = () => {
  const [gymBuddies, setGymBuddies] = useState<GymBuddy[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const swipedIds = useRef<Set<string>>(new Set());

  // Ref pointing to the current top card
  const topCardRef = useRef<SwipeCardRef>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(SWIPED_IDS_KEY);
        if (stored) {
          swipedIds.current = new Set(JSON.parse(stored));
        }

        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Token not found");

        const response = await fetch(
          `${API_URL}/api/v1/user-profile?page=1&limit=10`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch profiles.");
        const result = await response.json();
        const profiles = result.data || [];

        const transformed: GymBuddy[] = profiles
          .map((p: any) => ({
            id: p._id,
            user: p.user?._id ?? p.user,
            name: p.firstName || "Unknown",
            age: new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
            distance: `${Math.floor(Math.random() * 10) + 1} km`,
            bio: p.bio || "Let's work out together!",
            image: p.imageUrl?.[0] || "https://via.placeholder.com/400",
            tags: p.interests?.slice(0, 3).map((i: any) => i.name) || ["Fitness"],
          }))
          .filter((p: GymBuddy) => !swipedIds.current.has(p.user) && !swipedIds.current.has(p.id));

        setGymBuddies(transformed);
      } catch (error) {
        console.error("Error fetching gym buddies:", error);
        Alert.alert("Error", "Failed to load gym buddies.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSwipe = useCallback(
    async (direction: "left" | "right", cardIndex: number) => {
      setCurrentIndex((prev) => prev + 1);

      const swipedUser = gymBuddies[cardIndex];
      if (!swipedUser) return;

      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Token not found");

        const decoded = decodeJWT(token);
        const swiperId = decoded?.id || decoded?._id || decoded?.userId || decoded?.sub;

        if (!swiperId) {
          console.error("decodeJWT payload:", decoded);
          Alert.alert("Auth Error", "Could not read user ID from token. Check console for JWT payload.");
          return;
        }

        const swipedId = swipedUser.id; // UserProfile._id — what the Swipe model expects
        const swipeResponse = await fetch(`${API_URL}/api/v1/swipeUser/swipes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ swiperId, swipedId, direction }),
        });

        if (swipeResponse.ok) {
          swipedIds.current.add(swipedId);
          await AsyncStorage.setItem(SWIPED_IDS_KEY, JSON.stringify([...swipedIds.current]));
        } else {
          const err = await swipeResponse.json();
          console.error("Swipe API error:", err);
        }
      } catch (error) {
        console.error("Swipe API Error:", error);
      }
    },
    [gymBuddies]
  );

  // Button handlers — trigger animation on card, card calls onSwipe when done
  const pressSwipeLeft = () => topCardRef.current?.swipeLeft();
  const pressSwipeRight = () => topCardRef.current?.swipeRight();

  const visibleCards = gymBuddies
    .slice(currentIndex, currentIndex + 3)
    .reverse();

  const isOutOfCards = !loading && currentIndex >= gymBuddies.length;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.centered}>
          <Text style={styles.messageText}>Loading buddies...</Text>
        </View>
      )}

      {isOutOfCards && (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={64} color="#555" />
          <Text style={styles.messageText}>No more buddies to show!</Text>
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.removeItem(SWIPED_IDS_KEY);
              swipedIds.current = new Set();
              setCurrentIndex(0);
              setLoading(true);
              try {
                const token = await AsyncStorage.getItem("authToken");
                const response = await fetch(`${API_URL}/api/v1/user-profile?page=1&limit=10`, {
                  method: "GET",
                  headers: { Authorization: `Bearer ${token}` },
                });
                const result = await response.json();
                const profiles = result.data || [];
                setGymBuddies(
                  profiles.map((p: any) => ({
                    id: p._id,
                    user: p.user?._id ?? p.user,
                    name: p.firstName || "Unknown",
                    age: new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
                    distance: `${Math.floor(Math.random() * 10) + 1} km`,
                    bio: p.bio || "Let's work out together!",
                    image: p.imageUrl?.[0] || "https://via.placeholder.com/400",
                    tags: p.interests?.slice(0, 3).map((i: any) => i.name) || ["Fitness"],
                  }))
                );
              } catch (e) {
                Alert.alert("Error", "Failed to reload profiles.");
              } finally {
                setLoading(false);
              }
            }}
            style={{ marginTop: 16, backgroundColor: "#333", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
          >
            <Text style={{ color: "#fff", fontSize: 14 }}>Refresh Buddies</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.swiperContainer}>
        {visibleCards.map((buddy) => {
          const globalIndex = gymBuddies.indexOf(buddy);
          const stackIndex = globalIndex - currentIndex;
          const isTop = stackIndex === 0;

          return (
            <SwipeCard
              key={buddy.id}
              ref={isTop ? topCardRef : null}
              buddy={buddy}
              isTop={isTop}
              stackIndex={stackIndex}
              onSwipe={(dir) => handleSwipe(dir, globalIndex)}
            />
          );
        })}
      </View>

      {!isOutOfCards && !loading && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={pressSwipeLeft}>
            <Ionicons name="close-circle" size={64} color="#ff6b6b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={pressSwipeRight}>
            <Ionicons name="heart-circle" size={64} color="#4cd137" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default GymBuddyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  messageText: { color: "#666", fontSize: 18 },
  swiperContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: width * 0.9,
    height: height * 0.65,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1e1e1e",
  },
  image: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  cardContent: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  name: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  distance: { color: "#ddd", fontSize: 14, marginTop: 2 },
  bio: { color: "#ccc", marginTop: 8, fontSize: 14 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 6 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: "#fff", fontSize: 12 },
  overlayBadge: {
    position: "absolute",
    top: 40,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  likeBadge: { left: 20, borderColor: "#4cd137", transform: [{ rotate: "-15deg" }] },
  likeBadgeText: { color: "#4cd137", fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  nopeBadge: { right: 20, borderColor: "#ff6b6b", transform: [{ rotate: "15deg" }] },
  nopeBadgeText: { color: "#ff6b6b", fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingBottom: 40,
    paddingTop: 10,
  },
});
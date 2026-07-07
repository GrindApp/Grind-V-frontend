import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { SkeletonBox } from "@/app/components/SkeletonBox";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import StarRating from "react-native-star-rating-widget";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";
import { fetchGymById } from "@/apis/gyms";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const GymProfileScreen = () => {
  const { gymId } = useLocalSearchParams<{ gymId: string }>();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("monday");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReviewText, setNewReviewText] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [reviews, setReviews] = useState([
    {
      id: "1",
      name: "Irtiqa",
      rating: 5,
      text: "Great gym, with a good number of professional trainers and machines.",
    },
    {
      id: "2",
      name: "Aryan",
      rating: 4,
      text: "Nice environment and friendly staff. Worth the price!",
    },
    {
      id: "3",
      name: "Maya",
      rating: 5,
      text: "Excellent variety of classes like Zumba and Yoga. Loved it!",
    },
  ]);

  // Fetch gym details + auth + initial favorite state
  useEffect(() => {
    const loadGym = async () => {
      try {
        const data = await fetchGymById(gymId);
        setGym(data);
      } catch (err) {
        console.error("Error loading gym:", err);
      } finally {
        setLoading(false);
      }
    };

    const initAuth = async () => {
      try {
        const tok = await AsyncStorage.getItem("authToken");
        if (!tok) return;
        setAuthToken(tok);
        const decoded = decodeJWT(tok) as any;
        const uid = decoded?.id || decoded?._id;
        if (!uid) return;
        setUserId(uid);

        const res = await fetch(
          `${API_URL}/api/v1/userProfile/user/${uid}/favorite-gym-ids`,
          { headers: { Authorization: `Bearer ${tok}` } }
        );
        const json = await res.json();
        if (json.success && gymId) {
          setIsFavorite(json.data.includes(gymId));
        }
      } catch {}
    };

    if (gymId) {
      loadGym();
      initAuth();
    }
  }, [gymId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const toggleFavorite = async () => {
    if (!userId || !authToken) return;
    const wasLiked = isFavorite;
    setIsFavorite(!wasLiked);
    showToast(wasLiked ? "Removed from OG Collection" : "Saved to your OG Collection ❤️");
    try {
      await fetch(
        `${API_URL}/api/v1/userProfile/user/${userId}/favorite-gym/${gymId}`,
        { method: "POST", headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch {
      setIsFavorite(wasLiked);
    }
  };

  const handleAddReview = () => {
    if (newReviewText.trim()) {
      const newReview = {
        id: Date.now().toString(),
        name: "You",
        rating: newRating,
        text: newReviewText.trim(),
      };
      setReviews([newReview, ...reviews]);
      setNewReviewText("");
      setNewRating(5);
      setShowAddReviewModal(false);
    }
  };

  if (loading) {
    const screenWidth = Dimensions.get("window").width;
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cover image */}
          <SkeletonBox width={screenWidth} height={256} borderRadius={0} />

          <View className="p-5">
            {/* Rating + address row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <SkeletonBox width={60} height={18} borderRadius={6} />
              <SkeletonBox width={130} height={18} borderRadius={6} />
            </View>

            {/* Gym name */}
            <SkeletonBox height={28} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width="70%" height={16} borderRadius={6} style={{ marginBottom: 24 }} />

            {/* Hours section */}
            <SkeletonBox width={100} height={14} borderRadius={5} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonBox key={i} width={44} height={36} borderRadius={8} />
              ))}
            </View>

            {/* Amenities */}
            <SkeletonBox width={100} height={14} borderRadius={5} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonBox key={i} width={90} height={32} borderRadius={20} />
              ))}
            </View>

            {/* Action button */}
            <SkeletonBox height={52} borderRadius={12} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!gym) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <Text className="text-white">Gym not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1">
        {/* Cover Image with back button */}
        <View style={{ position: "relative" }}>
          <Image
            source={gym.imageUrls?.[0] || "https://via.placeholder.com/400"}
            style={{
              width: "100%",
              height: 256,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
            contentFit="cover"
            transition={300}
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleFavorite}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? "#EF4444" : "white"}
            />
          </TouchableOpacity>
        </View>

        <View className="p-5 bg-primary">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Ionicons name="star" size={18} color="#facc15" />
              <Text className="text-white text-base ml-1 font-medium">
                {gym.rating?.toFixed(1) || "N/A"}
              </Text>
            </View>
            <Text className="text-[#a1a1aa] text-sm">{gym.address}</Text>
          </View>

          <Text className="text-white text-3xl font-bold mt-1">{gym.name}</Text>
          <Text className="text-[#a1a1aa] mt-2 text-sm leading-5">
            {gym.amenities?.join(", ")}
          </Text>

          {/* Opening Hours with Day Selector */}
          <View className="mt-6">
            <Text className="text-[#a1a1aa] text-sm font-medium mb-2">
              Opening Hours
            </Text>

            {/* Days Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row mb-3"
            >
              {Object.keys(gym.openingHours || {}).map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl mr-2 ${
                    selectedDay === day ? "bg-[#ef4444]" : "bg-[#1f1f23]"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedDay === day ? "text-white" : "text-[#a1a1aa]"
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selected Day Hours */}
            <View className="bg-[#1f1f23] p-4 rounded-xl">
              <Text className="text-white text-base font-semibold">
                {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
              </Text>
              <Text className="text-[#a1a1aa] mt-1 text-sm">
                {gym.openingHours?.[selectedDay] || "Closed"}
              </Text>
            </View>
          </View>

          {/* Membership Plans */}
          <Text className="text-[#a1a1aa] mt-6 mb-2 text-sm font-medium">
            Membership Charges
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {gym.pricing && (
              <>
                <View className="bg-[#1f1f23] p-4 m-1 rounded-xl flex-1 min-w-[47%]">
                  <Text className="text-white font-semibold text-base">
                    ₹{gym.pricing.monthly}
                  </Text>
                  <Text className="text-[#a1a1aa] text-sm">Monthly</Text>
                </View>
                <View className="bg-[#1f1f23] p-4 m-1 rounded-xl flex-1 min-w-[47%]">
                  <Text className="text-white font-semibold text-base">
                    ₹{gym.pricing.quarterly}
                  </Text>
                  <Text className="text-[#a1a1aa] text-sm">Quarterly</Text>
                </View>
                <View className="bg-[#1f1f23] p-4 m-1 rounded-xl flex-1 min-w-[47%]">
                  <Text className="text-white font-semibold text-base">
                    ₹{gym.pricing.yearly}
                  </Text>
                  <Text className="text-[#a1a1aa] text-sm">Yearly</Text>
                </View>
              </>
            )}
          </View>

          {/* Reviews (Static for now) */}
          <View className="mt-6 flex-row justify-between items-center">
            <Text className="text-[#a1a1aa] text-sm font-medium">Reviews</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setShowAddReviewModal(true)}>
                <Text className="text-[#22c55e] text-sm font-medium">
                  Add Review
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowReviewsModal(true)}>
                <Text className="text-[#ef4444] text-sm font-medium">
                  See All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {reviews.slice(0, 2).map((review) => (
            <View key={review.id} className="bg-[#1f1f23] p-4 rounded-xl mt-2">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white font-semibold text-sm">
                  {review.name}
                </Text>
                <StarRating
                  rating={review.rating}
                  starSize={16}
                  onChange={() => {}}
                  color="#facc15"
                  enableSwiping={false}
                />
              </View>
              <Text className="text-[#d4d4d8] text-sm leading-5">
                {review.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer Buttons */}
        <View className="flex-row justify-between px-5 py-4 bg-primary">
          <TouchableOpacity className="flex-1 p-3 bg-[#1f2937] items-center rounded-xl mr-2">
            <Text className="text-white font-semibold">DIRECTIONS</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 p-3 bg-[#ef4444] items-center rounded-xl ml-2">
            <Text className="text-white font-semibold">CALL/MESSAGE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: View All Reviews */}
      <Modal
        visible={showReviewsModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-[#000000cc] justify-end">
          <View className="bg-[#1f1f23] p-5 rounded-t-3xl max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                All Reviews
              </Text>
              <Pressable onPress={() => setShowReviewsModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-[#111111] p-4 rounded-xl mb-3">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-white font-semibold">
                      {item.name}
                    </Text>
                    <StarRating
                      rating={item.rating}
                      starSize={16}
                      onChange={() => {}}
                      color="#facc15"
                      enableSwiping={false}
                    />
                  </View>
                  <Text className="text-[#d4d4d8] text-sm">{item.text}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 100,
          alignSelf: "center",
          backgroundColor: "#1C1C1E",
          borderRadius: 24,
          paddingHorizontal: 18,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          opacity: toastOpacity,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 999,
        }}
      >
        <Ionicons name="heart" size={16} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{toastMsg}</Text>
      </Animated.View>

      {/* Modal: Add Review */}
      <Modal
        visible={showAddReviewModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-[#000000cc]"
        >
          <View className="bg-[#1f1f23] p-5 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                Add Review
              </Text>
              <Pressable onPress={() => setShowAddReviewModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            <StarRating
              rating={newRating}
              onChange={setNewRating}
              starSize={28}
              color="#facc15"
            />

            <TextInput
              placeholder="Write your review..."
              placeholderTextColor="#9ca3af"
              multiline
              className="bg-[#111111] mt-4 text-white p-3 rounded-xl h-32 text-sm"
              value={newReviewText}
              onChangeText={setNewReviewText}
            />

            <TouchableOpacity
              className="bg-[#22c55e] p-3 rounded-xl mt-4 items-center"
              onPress={handleAddReview}
            >
              <Text className="text-white font-semibold">Submit Review</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default GymProfileScreen;

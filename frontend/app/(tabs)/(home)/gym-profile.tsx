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
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import StarRating from "react-native-star-rating-widget";
import { useLocalSearchParams } from "expo-router";
import { fetchGymById } from "@/apis/gyms";

const GymProfileScreen = () => {
  const { gymId } = useLocalSearchParams<{ gymId: string }>();
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

  // Fetch gym details
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
    if (gymId) loadGym();
  }, [gymId]);

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
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-2">Loading gym details...</Text>
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
        {/* Cover Image */}
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

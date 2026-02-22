import React, { useState } from "react";
import { View, Text, Image, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Carousel from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width - 32;
const IMAGE_HEIGHT = 220;

type GymCardProps = {
  name: string;
  images: string[];
  distance: string;
  rating: string;
  reviews?: number;
  price?: string;
  priceCategory?: string;
  tags?: string[];
  isFavorite?: boolean;
  amenities?: string[];
  onPress?: () => void;
  onFavoritePress?: () => void;
};

const GymCard = ({
  name,
  images,
  distance,
  rating,
  reviews = 0,
  price,
  priceCategory = "$$$",
  isFavorite = false,
  amenities,
  onPress,
  onFavoritePress,
}: GymCardProps) => {
  console.log("GymItem jjjjj");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavoritePress = () => {
    setFavorite(!favorite);
    if (onFavoritePress) onFavoritePress();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      className="mb-8 bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-xl"
      style={{
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      {/* Image Carousel with Pagination */}
      <View>
        <Carousel
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          data={images}
          scrollAnimationDuration={800}
          autoPlay={false}
          onProgressChange={(_, absoluteProgress) => {
            setCurrentIndex(Math.round(absoluteProgress));
          }}
          renderItem={({ item }) => (
            <View className="relative">
              <Image
                source={{ uri: item }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                className="absolute bottom-0 left-0 right-0 h-24"
              />
            </View>
          )}
          style={{ alignSelf: "center" }}
          loop
        />

        {/* Carousel Pagination */}
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center space-x-1.5">
          {images.map((_, index) => (
            <View
              key={index}
              className={`h-1.5 rounded-full ${
                currentIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          onPress={handleFavoritePress}
          className="absolute top-4 right-4 bg-black/30 p-2 rounded-full"
        >
          <Ionicons
            name={favorite ? "heart" : "heart-outline"}
            size={24}
            color={favorite ? "#FF375F" : "white"}
          />
        </TouchableOpacity>

        {/* Rating Badge */}
        <View className="absolute top-4 left-4 bg-black/30 px-2.5 py-1.5 rounded-lg flex-row items-center">
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text className="text-white font-bold text-sm ml-1">{rating}</Text>
          {reviews > 0 && (
            <Text className="text-gray-300 text-xs ml-1">({reviews})</Text>
          )}
        </View>

        {/* TODO: Distance Badge */}
        <View className="absolute bottom-4 right-4 bg-black/50 px-2.5 py-1.5 rounded-lg flex-row items-center">
          <Ionicons name="location" size={14} color="#ffffff" />
          <Text className="text-white text-xs ml-1 font-medium">
            {"Dwarka"}
          </Text>
        </View>
      </View>

      <View className="p-5">
        {/* Gym Name and Price */}
        <View className="flex-row justify-between items-start mb-2">
          <Text
            className="text-white text-xl font-bold flex-1 mr-2"
            numberOfLines={1}
          >
            {name}
          </Text>
          {price && (
            <View className="flex-row items-center">
              <Text className="text-green-400 font-bold">{price}</Text>
              <Text className="text-gray-400 text-xs ml-1">
                {priceCategory}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {/* {tags.length > 0 && (
          <View className="flex-row flex-wrap mt-3">
            {tags.slice(0, maxTagsToShow).map((tag, index) => (
              <View
                key={index}
                className="bg-[#2C2C2E] px-3 py-1.5 rounded-full mr-2 mb-2"
              >
                <Text className="text-gray-300 text-xs font-medium">{tag}</Text>
              </View>
            ))}
            {remainingTags > 0 && (
              <View className="bg-[#2C2C2E] px-3 py-1.5 rounded-full mb-2">
                <Text className="text-gray-300 text-xs font-medium">
                  +{remainingTags} more
                </Text>
              </View>
            )}
          </View>
        )} */}

        {/* Features & Amenities */}
        <View className="flex-row mt-4 justify-between">
          {amenities?.map((amenity) => (
            <View className="flex-row items-center" key={amenity}>
              <View className="w-8 h-8 bg-[#333336] rounded-full items-center justify-center">
                <Ionicons name="barbell-outline" size={16} color="#fff" />
              </View>
              <Text className="text-gray-300 text-xs ml-2">{amenity}</Text>
            </View>
          ))}
          {/* <View className="flex-row items-center">
            <View className="w-8 h-8 bg-[#333336] rounded-full items-center justify-center">
              <Ionicons name="wifi-outline" size={16} color="#fff" />
            </View>
            <Text className="text-gray-300 text-xs ml-2">Wi-Fi</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-[#333336] rounded-full items-center justify-center">
              <Ionicons name="water-outline" size={16} color="#fff" />
            </View>
            <Text className="text-gray-300 text-xs ml-2">Showers</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-[#333336] rounded-full items-center justify-center">
              <Ionicons name="people-outline" size={16} color="#fff" />
            </View>
            <Text className="text-gray-300 text-xs ml-2">Classes</Text>
          </View> */}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default GymCard;

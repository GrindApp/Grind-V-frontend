import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorite, setFavorite] = useState(isFavorite);

  useEffect(() => { setFavorite(isFavorite); }, [isFavorite]);

  const handleFavoritePress = () => {
    setFavorite(!favorite);
    if (onFavoritePress) onFavoritePress();
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setCurrentIndex(index);
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
      {/* ─── Image Slider (replaces react-native-reanimated-carousel) ─── */}
      <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
        <FlatList
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          initialNumToRender={1}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
              <Image
                source={{ uri: item }}
                style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 96,
                }}
              />
            </View>
          )}
        />

        {/* Carousel Pagination */}
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center space-x-1.5">
          {images.map((_, index) => (
            <View
              key={index}
              style={{
                height: 6,
                borderRadius: 3,
                width: currentIndex === index ? 24 : 6,
                backgroundColor:
                  currentIndex === index
                    ? "rgba(255,255,255,1)"
                    : "rgba(255,255,255,0.5)",
              }}
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

        {/* Distance Badge */}
        <View className="absolute bottom-4 right-4 bg-black/50 px-2.5 py-1.5 rounded-lg flex-row items-center">
          <Ionicons name="location" size={14} color="#ffffff" />
          <Text className="text-white text-xs ml-1 font-medium">{"Dwarka"}</Text>
        </View>
      </View>
      {/* ─────────────────────────────────────────────────────────────── */}

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
              <Text className="text-gray-400 text-xs ml-1">{priceCategory}</Text>
            </View>
          )}
        </View>

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
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default GymCard;
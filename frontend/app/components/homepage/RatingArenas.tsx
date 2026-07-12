import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { fetchGyms } from "@/apis/gyms";

type GymItemType = {
  _id: string;
  id: string;
  name: string;
  location: string;
  rating: number;
  facilities: string[];
  categories: string[];
  imageUrl: string;
  amenities: string[];
  imageUrls: string[];
};

const RatingArenas = () => {
  const router = useRouter();
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGyms = async () => {
      try {
        setLoading(true);
        const data = await fetchGyms({
          page: 1,
          pageSize: 10,
          filters: { min_rating: 5 }, // ✅ Only fetch 5 star gyms
        });
        setGyms(data.results || []);
      } catch (err) {
        console.error("Error fetching 5⭐ gyms:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGyms();
  }, []);

  const handleGymPress = (gym: GymItemType) => {
    const gymId = gym._id || gym.id;
    router.push({
      pathname: "/(tabs)/(home)/gym-profile",
      params: { gymId },
    });
  };

  return (
    <View className="px-6 my-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white text-xl font-bold">The 5 ⭐ rating arenas</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/(home)/rating-arenas")}>
          <Text className="text-sm text-gray-400 font-medium">See all</Text>
        </TouchableOpacity>
      </View>

      {/* Gym List */}
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : gyms.length > 0 ? (
        <FlatList
          data={gyms}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="w-48 bg-[#23262B] rounded-2xl p-3"
              onPress={() => handleGymPress(item)}
            >
              <Image
                source={{ uri: item.imageUrls?.[0] }}
                style={{ width: "100%", height: 112, borderRadius: 12, marginBottom: 12 }}
                contentFit="cover"
              />
              <Text className="text-white font-semibold text-sm mb-1" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-gray-400 text-xs">{item.address || "Nearby"}</Text>
              <Text className="text-yellow-400 text-xs mt-1 font-medium">
                ⭐ {item.rating?.toFixed(1) || "N/A"}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text className="text-gray-400 text-sm">No 5★ gyms found</Text>
      )}
    </View>
  );
};

export default RatingArenas;

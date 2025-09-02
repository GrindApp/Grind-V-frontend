import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import GymCard from "../GymCard";
import { fetchGyms } from "@/apis/gyms";
import GymProfileScreen from "@/app/(tabs)/(home)/gym-profile";

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

const PAGE_SIZE = 10;

const GymList = () => {
  const [gyms, setGyms] = useState<GymItemType[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  const loadGyms = async (pageToLoad: number, reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    console.log(`Loading gyms - Page: ${pageToLoad}, Reset: ${reset}`);

    try {
      const data = await fetchGyms({ page: pageToLoad, pageSize: PAGE_SIZE });
      console.log(
        `Received ${data.results.length} gyms, Total count: ${data.count}`
      );

      if (reset) {
        setGyms(data.results);
        setPage(2); // Next page to load
        setHasMore(data.results.length === PAGE_SIZE); // Has more if we got full page
      } else {
        setGyms((prev) => [...prev, ...data.results]);
        setPage(pageToLoad + 1); // Next page to load
        setHasMore(data.results.length === PAGE_SIZE); // Has more if we got full page
      }
    } catch (error) {
      console.error("Error fetching gyms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load first page on mount
  useEffect(() => {
    loadGyms(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      console.log(`Loading more gyms - Page: ${page}`);
      loadGyms(page);
    }
  };

  const handleSeeAllPress = () => {
    console.log("Navigating to gym list screen");
    router.push("/(tabs)/(home)/all-gyms");
  };

  const handleGymPress = (gym: GymItemType) => {
    const gymId = gym._id || gym.id;
    console.log("Navigating to gym profile with ID:", gymId);

    router.push({
      pathname: "/(tabs)/(home)/gym-profile",
      params: { gymId },
    });
  };

  const renderGymItem = ({ item }: { item: GymItemType }) => (
    <GymCard
      name={item.name}
      images={item.imageUrls}
      distance={item.location}
      rating={item.rating?.toFixed(1)}
      reviews={Math.floor(item.rating * 20)}
      price="₹999/mo"
      priceCategory="₹₹"
      isFavorite={false}
      amenities={item.amenities}
      onPress={() => handleGymPress(item)}
    />
  );

  return (
    <View>
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-white text-lg font-medium">Nearby Gyms</Text>
        <TouchableOpacity onPress={() => handleSeeAllPress()}>
          <Text className="text-sm text-gray-400 font-medium">See all</Text>
        </TouchableOpacity>
      </View>

      {gyms.length > 0 ? (
        <FlatList
          data={gyms}
          renderItem={renderGymItem}
          keyExtractor={(item, index) =>
            item._id?.toString() || item.id?.toString() || index.toString()
          }
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // trigger when close to bottom
          ListFooterComponent={
            loading ? (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginVertical: 16 }}
              />
            ) : !hasMore && gyms.length > 0 ? (
              <Text className="text-gray-400 text-center py-4">
                No more gyms to load
              </Text>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : loading ? (
        <View className="bg-[#262629] rounded-lg mx-4 p-4 items-center">
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-white text-center mt-2">Loading gyms...</Text>
        </View>
      ) : (
        <View className="bg-[#262629] rounded-lg mx-4 p-4 items-center">
          <Text className="text-white text-center">No gyms available</Text>
        </View>
      )}
    </View>
  );
};

export default GymList;

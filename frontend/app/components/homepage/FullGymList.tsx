import React, { useEffect, useState } from "react";
import { FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import GymCard from "../GymCard";
import { fetchGyms } from "@/apis/gyms";

type GymItemType = {
  address: string;
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

const FullGymList = () => {
  const [gyms, setGyms] = useState<GymItemType[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  const loadGyms = async (pageToLoad: number, reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);

    try {
      const data = await fetchGyms({ page: pageToLoad, pageSize: PAGE_SIZE });
      if (reset) {
        setGyms(data.results);
        setPage(2);
        setHasMore(data.results.length === PAGE_SIZE);
      } else {
        setGyms((prev) => [...prev, ...data.results]);
        setPage(pageToLoad + 1);
        setHasMore(data.results.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error("Error fetching gyms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGyms(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) loadGyms(page);
  };

  const handleGymPress = (gym: GymItemType) => {
    const gymId = gym._id || gym.id;
    router.push({
      pathname: "/(tabs)/(home)/gym-profile",
      params: { gymId },
    });
  };

  return (
    <FlatList
      data={gyms}
      renderItem={({ item }) => (
        <GymCard
          name={item.name}
          images={item.imageUrls}
          distance={item.address}
          rating={item.rating?.toFixed(1)}
          reviews={Math.floor(item.rating * 20)}
          price="₹999/mo"
          priceCategory="₹₹"
          isFavorite={false}
          amenities={item.amenities}
          onPress={() => handleGymPress(item)}
        />
      )}
      keyExtractor={(item, index) =>
        item._id?.toString() || item.id?.toString() || index.toString()
      }
      showsVerticalScrollIndicator={false}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 16 }} />
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default FullGymList;

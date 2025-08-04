import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import GymCard from "../GymCard";
import useGyms from "../../../hooks/apis/queries/useGyms.js";

type GymItemType = {
  id: string;
  name: string;
  location: string;
  rating: number;
  facilities: string[];
  categories: string[];
  imageUrl: string;
};

type Props = {
  searchQuery?: string;
};

const GymList = ({ searchQuery = "" }: Props) => {
  const { isLoading, data } = useGyms();
  const [filteredGyms, setFilteredGyms] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGyms(data);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = data.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.facilities.some((facility) =>
          facility.toLowerCase().includes(query)
        ) ||
        gym.categories.some((category) =>
          category.toLowerCase().includes(query)
        )
    );

    setFilteredGyms(filtered);
  }, [searchQuery, data]);
  const renderGymItem = ({ item }: { item: GymItemType }) => {
    console.log("Item",item);
    return (
      <GymCard
        key={item.id}
        name={item.name}
        images={item.imageUrls}
        distance={item.location}
        rating={item.rating.toFixed(1)}
        reviews={Math.floor(item.rating * 20)} // Mock reviews
        price="₹999/mo" // You can modify this if needed
        priceCategory="₹₹"
        isFavorite={false}
        amenities={item.amenities}
        // onPress={() => router.push(`/gym/${item.id}`)}
      />
    );
  };

  return (
    <View>
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-white text-lg font-medium">Nearby Gyms</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/(home)/gymProfile")}
        >
          <Text className="text-sm text-gray-400 font-medium">See all</Text>
        </TouchableOpacity>
      </View>

      {filteredGyms.length > 0 ? (
        <FlatList
          data={filteredGyms}
          renderItem={renderGymItem}
          keyExtractor={(item) => item.id}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      ) : (
        <View className="bg-[#262629] rounded-lg mx-4 p-4 items-center">
          <Text className="text-white text-center">
            {searchQuery.trim()
              ? `No gyms found matching "${searchQuery}"`
              : "No gyms available"}
          </Text>
        </View>
      )}
    </View>
  );
};

export default GymList;

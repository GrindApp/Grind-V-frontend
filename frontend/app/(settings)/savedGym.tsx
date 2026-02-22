import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import GymCard from "../components/GymCard";
import { Alert, FlatList, TouchableOpacity, View, Text, Image , ScrollView,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";

interface Gym {
  id: string;
  name: string;
  address: string;
  distance: string;
  image: any;
  tags: string[];
  rating: string;
}

interface Exercise {
  id: string;
  name: string;
  image: any;
  duration: string;
  difficulty: string;
  category: string;
}

const initialGyms: Gym[] = [
  {
    id: "101",
    name: "Iron Paradise",
    address: "Sector 21, Dwarka, New Delhi",
    distance: "450 meters away",
    image: { uri: "https://source.unsplash.com/1600x900/?gym,weights" },
    tags: ["Yoga", "Zumba", "Pilates"],
    rating: "4.8",
  },
  {
    id: "102",
    name: "Flex Gym & Fitness",
    address: "Rajouri Garden, New Delhi",
    distance: "300 meters away",
    image: { uri: "https://source.unsplash.com/1600x900/?gym,fitness" },
    tags: ["Yoga", "Zumba", "Pilates"],
    rating: "4.6",
  },
];

const initialExercises: Exercise[] = [
  {
    id: "201",
    name: "Hamstring Stretch",
    image: { uri: "https://source.unsplash.com/1600x900/?stretch,hamstring" },
    duration: "2-3 minutes",
    difficulty: "Intermediate",
    category: "Stretching",
  },
  {
    id: "202",
    name: "Back Stretches",
    image: { uri: "https://source.unsplash.com/1600x900/?stretch,back" },
    duration: "3-5 minutes",
    difficulty: "Beginner",
    category: "Stretching",
  },
  {
    id: "203",
    name: "Neck Stretches",
    image: { uri: "https://source.unsplash.com/1600x900/?stretch,neck" },
    duration: "2 minutes",
    difficulty: "Beginner",
    category: "Stretching",
  },
];

type TabType = "gyms" | "exercises";

const SavedGyms = () => {
  const [activeTab, setActiveTab] = useState<TabType>("gyms");
  const [gyms, setGyms] = useState<Gym[]>(initialGyms);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  const handleUnsaveGym = (id: string) => {
    Alert.alert(
      "Remove Gym",
      "Are you sure you want to remove this gym from your saved list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setGyms((prev) => prev.filter((gym) => gym.id !== id)),
        },
      ]
    );
  };

  const handleUnsaveExercise = (id: string) => {
    Alert.alert(
      "Remove Exercise",
      "Are you sure you want to remove this exercise from your bookmarks?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setExercises((prev) => prev.filter((ex) => ex.id !== id)),
        },
      ]
    );
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <Animated.View entering={FadeInRight.delay(100).duration(300)}>
      <TouchableOpacity 
        className="flex-row bg-zinc-800 rounded-xl mx-4 mb-3 overflow-hidden shadow-md shadow-black/40"
        activeOpacity={0.7}
        // onPress={() => router.push(`/exercise-details/${item.id}`)}
      >
        <Image
          source={item.image}
          className="w-24 h-24"
          resizeMode="cover"
        />
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-white font-semibold text-base">{item.name}</Text>
            <Text className="text-gray-400 text-xs mt-1">{item.category}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color="#f43f5e" />
              <Text className="text-gray-300 text-xs ml-1">{item.duration}</Text>
              <View className="h-1.5 w-1.5 bg-gray-600 rounded-full mx-2" />
              <Text className="text-gray-300 text-xs">{item.difficulty}</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleUnsaveExercise(item.id)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="bookmark" size={18} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
   
   <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1 px-5 py-6">
      {/* Header with back button */}
       <View className="flex-row items-center mb-6  space-x-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2 bg-zinc-800/80 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-2xl ml-2 font-bold">Saved</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-3">
        <View className="flex-row bg-zinc-800 rounded-xl p-1 w-full">
          {[
            { id: "gyms" as TabType, label: "Gyms", icon: "barbell-outline" },
            { id: "exercises" as TabType, label: "Exercises", icon: "body-outline" }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-lg ${
                activeTab === tab.id ? "bg-accent" : "bg-transparent"
              }`}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color="white" 
                style={{ marginRight: 6 }} 
              />
              <Text 
                className={`text-white text-sm font-medium ${
                  activeTab === tab.id ? "font-semibold" : ""
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content based on active tab */}
      {activeTab === "gyms" ? (
        gyms.length > 0 ? (
          <FlatList
            data={gyms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Animated.View entering={FadeIn.duration(300)}>
                <GymCard
                  name={item.name}
                  images={[item.image.uri]}
                  distance={item.distance}
                  rating={item.rating}
                  tags={item.tags}
                  isFavorite={true}
                  onFavoritePress={() => handleUnsaveGym(item.id)}
                  // onPress={() => router.push(`/gym/${item.id}`)}
                />
              </Animated.View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 2 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="barbell-outline" size={48} color="#555" />
            <Text className="text-gray-400 text-center text-base mt-4">
              You haven't saved any gyms yet.
            </Text>
            <TouchableOpacity 
              className="mt-5 px-6 py-3 bg-red-600 rounded-xl"
              onPress={() => router.push("/explore")}
              activeOpacity={0.8}
            >
              <Text className="text-white font-medium">Explore Gyms</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        exercises.length > 0 ? (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="body-outline" size={48} color="#555" />
            <Text className="text-gray-400 text-center text-base mt-4">
              You haven't bookmarked any exercises yet.
            </Text>
            <TouchableOpacity 
              className="mt-5 px-6 py-3 bg-red-600 rounded-xl"
              onPress={() => router.push("/(tabs)/(exercise)/explore")}
              activeOpacity={0.8}
            >
              <Text className="text-white font-medium">Browse Exercises</Text>
            </TouchableOpacity>
          </View>
        )
      )}
      </ScrollView>
   
    </SafeAreaView>
  );
};

export default SavedGyms;
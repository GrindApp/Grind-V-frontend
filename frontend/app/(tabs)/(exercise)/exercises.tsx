import React, { useState, useCallback, useMemo } from "react";
import { Animated,ScrollView } from 'react-native';
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Search, ArrowRight, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import SearchBar from "@/app/components/SearchBar";

// Mock data
const categories = [
  {
    id: "1",
    name: "STRENGTH TRAINING",
    image: "https://picsum.photos/id/1016/1600/900",
    workouts: 42,
  },
  { 
    id: "2", 
    name: "YOGA", 
    image: "https://picsum.photos/id/1020/1600/900",
    workouts: 28,
  },
  { 
    id: "3", 
    name: "CARDIO", 
    image: "https://picsum.photos/id/1013/1600/900",
    workouts: 35,
  },
  {
    id: "4",
    name: "STRETCHING",
    image: "https://picsum.photos/id/1022/1600/900",
    workouts: 15,
  },
  {
    id: "5",
    name: "ENDURANCE TRAINING",
    image: "https://picsum.photos/id/1011/1600/900",
    workouts: 24,
  },
  {
    id: "6",
    name: "PUSH WORKOUT",
    image: "https://picsum.photos/id/1015/1600/900",
    workouts: 31,
  },
];

const popularSearches = ["Weight Loss", "6-Pack Abs", "HIIT", "Full Body"];
const mockSearchResults = ["Manmohan Arora", "Man", "Manoj", "Mandir", "Max Fitness"];

const ExploreScreen = () => {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"ongoing" | "all">("all");

const ongoingPlans = categories.slice(0, 3); 


  // Memoize filtered results to avoid unnecessary recomputation
  const filteredResults = useMemo(() => {
    if (!search) return [];
    return mockSearchResults.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setShowResults(text.length > 0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
    setShowResults(false);
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    if (search.length === 0) {
      setShowResults(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity 
      className="mb-4 rounded-2xl overflow-hidden shadow-lg"
      activeOpacity={0.8}
    >
      <ImageBackground
  source={{ uri: item.image }}
  className="h-44"
  imageStyle={{ borderRadius: 16 }}
>
  <View className="flex-1 justify-end">
    {/* Add a solid black overlay with opacity */}
    <View
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Black with 60% opacity
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        padding: 16,
      }}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white text-lg font-bold">{item.name}</Text>
          <Text className="text-gray-300 text-sm mt-1">
            {item.workouts} workouts
          </Text>
        </View>
        <View className="bg-white/20 rounded-full p-2">
          <ArrowRight size={16} color="#fff" />
        </View>
      </View>
    </View>
  </View>
</ImageBackground>

    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: string }) => (
    <TouchableOpacity 
      className="flex-row items-center px-4 py-3 border-b border-neutral-800"
      onPress={() => {
        setSearch(item);
        setShowResults(false);
        Keyboard.dismiss();
      }}
    >
      <Search size={16} color="#6b7280" />
      <Text className="text-white ml-3">{item}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView className="flex-1 bg-primary">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View className="flex-1">
            {/* Fixed Header */}
            <View className="px-4 pt-4 pb-2 z-30">
              <Text className="text-white text-3xl font-bold mb-1">Explore</Text>
              <Text className="text-gray-400 text-base mb-3">Find workouts, trainers, and fitness partners</Text>
            </View>
  
            {/* Sticky Search Bar */}
            <Animated.View className="px-4 pb-2 z-20 bg-primary">
              <View className="relative">
                <SearchBar
                  value={search}
                  onChange={handleSearch}
                  onClear={clearSearch}
                  placeholder="Search workouts, trainers..."
                  autoFocus={false}
                />
  
                {/* Search Results Dropdown */}
                {showResults && (
                  <View className="absolute top-14 left-0 right-0 bg-neutral-900 rounded-2xl shadow-xl overflow-hidden border border-neutral-800 z-20">
                    {filteredResults.length > 0 ? (
                      <FlatList
                        data={filteredResults}
                        keyExtractor={(item, index) => `result-${index}`}
                        renderItem={renderSearchResult}
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled={filteredResults.length > 5}
                        maxToRenderPerBatch={10}
                        initialNumToRender={5}
                        style={{ maxHeight: 220 }}
                      />
                    ) : (
                      <View className="p-4 items-center">
                        <Text className="text-gray-400">No results found</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
  
            {/* Scrollable Content */}
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Popular Searches Tags */}
              {!showResults && (
                <View className="mb-6 mt-2">
                  <Text className="text-white font-medium text-base mb-2">Popular Searches</Text>
                  <View className="flex-row flex-wrap">
                    {popularSearches.map((item, index) => (
                      <TouchableOpacity
                        key={`popular-${index}`}
                        className="bg-neutral-800 px-3 py-1.5 rounded-full mr-2 mb-1"
                        onPress={() => handleSearch(item)}
                      >
                        <Text className="text-white text-sm">{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
  
              {/* Categories Section */}
              {!showResults && (
                <View className="mb-20">
                  <View className="items-center mb-4 mt-3">
                    <Text className="text-white font-bold text-2xl">Workout Categories</Text>
                  </View>
  
                  <View className="items-center mb-4">
                    <View className="flex-row bg-neutral-800 rounded-full p-0.5">
                      {["ongoing", "all"].map((tab) => (
                        <Pressable
                          key={tab}
                          onPress={() => setSelectedTab(tab as "ongoing" | "all")}
                          className={`px-4 py-1.5 rounded-full ${
                            selectedTab === tab ? "bg-white" : ""
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              selectedTab === tab ? "text-black" : "text-white"
                            }`}
                          >
                            {tab === "ongoing" ? "Ongoing" : "All Plans"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
  
                  {/* Replace FlatList with map to allow nesting in ScrollView */}
                  {(selectedTab === "ongoing" ? ongoingPlans : categories).map((item) => (
                    <View key={item.id} className="mb-4">
                      {renderCategoryItem({ item })}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ExploreScreen;
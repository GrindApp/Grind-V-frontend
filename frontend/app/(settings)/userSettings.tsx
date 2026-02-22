import React, { useState } from "react";
import { Image } from "expo-image";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Slider from "@react-native-community/slider";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Entypo,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

// Enable layout animation
if (Platform.OS === "android")
  UIManager.setLayoutAnimationEnabledExperimental?.(true);

const interestsList = [
  "Running/Jogging", "Weightlifting", "Yoga", "Cycling", "Swimming", "Crossfit",
  "Zumba", "Home Workout", "Powerlifting", "HIIT", "Dance", "Hiking",
  "Meditation", "Gymnastics", "Athletes",
];

const SettingsScreen = () => {
  const [distance, setDistance] = useState(10);
  const [discovery, setDiscovery] = useState(false);
  const [showMe, setShowMe] = useState<"Men" | "Women" | "Both">("Men");
  const [gymLevel, setGymLevel] = useState<"Beginner" | "Intermediate" | "Professional">("Beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [expanded, setExpanded] = useState({ distance: false, showMe: false, gymLevel: false, interest: false });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const toggleExpand = (key: keyof typeof expanded) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else if (interests.length < 5) {
      setInterests([...interests, tag]);
    } else {
      alert("You can select up to 5 interests only");
    }
  };

  const renderSection = (
    key: keyof typeof expanded,
    title: string,
    icon: JSX.Element,
    content: JSX.Element
  ) => (
    <View key={key} className="mb-5">
      <TouchableOpacity className="bg-[#1C1C1E] p-5 rounded-2xl" onPress={() => toggleExpand(key)}>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            {icon}
            <Text className="text-white font-medium text-base">{title}</Text>
          </View>
          <Ionicons name={expanded[key] ? "chevron-up" : "chevron-down"} size={18} color="#A1A1AA" />
        </View>
        {expanded[key] && content}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="bg-primary flex-1">
      <ScrollView className="flex-1 px-5 py-6">
        {/* Header */}
        
        <View className="flex-row items-center mb-6 space-x-4">
  <TouchableOpacity 
    onPress={() => router.back()}
    className="p-2 bg-zinc-800/80 rounded-full"
    activeOpacity={0.7}
  >
    <Ionicons name="chevron-back" size={18} color="white" />
  </TouchableOpacity>
  
  <Text className="text-white text-2xl font-bold"> Settings</Text>
</View>


        {/* Profile */}
        <View className="flex-row items-center justify-between mb-7 bg-[#1C1C1E] px-5 py-5 rounded-2xl">
          <View>
            <Text className="text-white text-xl font-semibold">Ayush Verma</Text>
            <Text className="text-gray-400 text-sm mt-1">ayush@example.com</Text>
            <TouchableOpacity onPress={() => router.push("/(settings)/EditProfileScreen")} className="mt-3 flex-row items-center">
              <Text className="text-accent font-medium">Edit Profile</Text>
              <Feather name="chevron-right" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <View className="relative">
            <Image
              source={profileImage || "https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2"}
              style={{ width: 90, height: 90, borderRadius: 45 }}
              className="border-2 border-accent"
            />
            <TouchableOpacity onPress={pickImage} className="absolute bottom-0 right-0 bg-accent p-2 rounded-full">
              <Entypo name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Distance */}
        {renderSection("distance", "Edit Distance Radius", <Feather name="map-pin" size={18} color="#EF4444" />, (
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-300 text-sm">Current Distance</Text>
              <Text className="text-white font-medium">{distance} kms</Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={distance}
              onValueChange={setDistance}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#3A3A3C"
              thumbTintColor="#EF4444"
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-400 text-xs">1 km</Text>
              <Text className="text-gray-400 text-xs">50 km</Text>
            </View>
            <TouchableOpacity className="mt-5 bg-accent py-3 rounded-xl" onPress={() => alert(`Distance saved: ${distance} kms`)}>
              <Text className="text-white font-semibold text-center">Save Changes</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Show Me */}
        {renderSection("showMe", "Show Me", <Feather name="users" size={18} color="#EF4444" />, (
          <View className="mt-3">
            {["Men", "Women", "Both"].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setShowMe(option as any)}
                className={`flex-row justify-between py-3 px-3 mb-2 rounded-lg ${showMe === option ? "bg-accent/20" : "bg-[#1C1C1E]"}`}>
                <Text className="text-white">{option}</Text>
                {showMe === option && <MaterialIcons name="check-circle" size={20} color="#EF4444" />}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Gym Level */}
        {renderSection("gymLevel", "Level of Gym Buddy", <FontAwesome5 name="dumbbell" size={16} color="#EF4444" />, (
          <View className="mt-3">
            {["Beginner", "Intermediate", "Professional"].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setGymLevel(level as any)}
                className={`flex-row justify-between py-3 px-3 mb-2 rounded-lg ${gymLevel === level ? "bg-accent/20" : "bg-[#1C1C1E]"}`}>
                <Text className="text-white">{level}</Text>
                {gymLevel === level && <MaterialIcons name="check-circle" size={20} color="#EF4444" />}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Interests */}
        {renderSection("interest", "Interests", <MaterialIcons name="interests" size={20} color="#EF4444" />, (
          <View className="mt-4">
            <View className="flex flex-row flex-wrap">
              {interestsList.map((tag) => {
                const selected = interests.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleInterest(tag)}
                    className={`px-4 py-2 mr-2 mb-3 rounded-full ${selected ? "bg-accent" : "bg-[#2C2C2E]"}`}>
                    <Text className={`text-sm ${selected ? "text-white font-medium" : "text-gray-300"}`}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-gray-400 text-xs mt-1">
              Selected: {interests.length}/5
              {interests.length === 5 && <Text className="text-accent"> – Maximum reached</Text>}
            </Text>
          </View>
        ))}

        {/* Discovery */}
        <View className="bg-[#1C1C1E] p-5 rounded-2xl mb-10">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-white font-medium text-base">Enable Discovery</Text>
              <Text className="text-gray-400 text-sm mt-1">See buddies and gyms near your location</Text>
            </View>
            <Switch
              value={discovery}
              onValueChange={setDiscovery}
              thumbColor={discovery ? "#fff" : "#f4f3f4"}
              trackColor={{ false: "#3A3A3C", true: "#EF4444" }}
              ios_backgroundColor="#3A3A3C"
              className="ml-2"
            />
          </View>
          {discovery && (
            <View className="mt-3 bg-[#2C2C2E] px-4 py-3 rounded-xl">
              <Text className="text-gray-300 text-sm">
                Discovery is enabled. You can now explore buddies and gyms within {distance} kms of your location.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

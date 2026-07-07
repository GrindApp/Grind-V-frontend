import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  LayoutAnimation,
  Platform,
  Alert,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { SkeletonBox } from "@/app/components/SkeletonBox";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (Platform.OS === "android")
  UIManager.setLayoutAnimationEnabledExperimental?.(true);

type GymLevel = "Beginner" | "Intermediate" | "Professional";
type ShowMe = "Men" | "Women" | "Both";
type Interest = { _id: string; name: string };

const SKILL_MAP: Record<GymLevel, string> = {
  Beginner: "beginner",
  Intermediate: "intermediate",
  Professional: "advanced",
};

const SKILL_REVERSE: Record<string, GymLevel> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Professional",
};

const SettingsScreen = () => {
  // Profile meta
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState("");
  const [formData, setFormData] = useState({ fullName: "", username: "" });

  // Settings state
  const [distance, setDistance] = useState(10);
  const [pendingDistance, setPendingDistance] = useState(10);
  const [discovery, setDiscovery] = useState(false);
  const [showMe, setShowMe] = useState<ShowMe>("Both");
  const [gymLevel, setGymLevel] = useState<GymLevel>("Beginner");
  const [interests, setInterests] = useState<string[]>([]);        // selected names
  const [allInterests, setAllInterests] = useState<Interest[]>([]); // full catalog

  // Saving indicators per field
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState({
    distance: false, showMe: false, gymLevel: false, interest: false,
  });

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const tok = await AsyncStorage.getItem("authToken");
      if (!tok) throw new Error("Not authenticated");
      setToken(tok);
      const decoded = decodeJWT(tok);
      const uid = decoded?.id || decoded?._id;
      if (!uid) throw new Error("Invalid token");
      setUserId(uid);

      const [profileRes, userRes, interestsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/userProfile/user/${uid}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
        fetch(`${API_URL}/api/v1/user/${uid}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
        fetch(`${API_URL}/api/v1/interests`),
      ]);

      const profileJson = await profileRes.json();
      const userJson = await userRes.json();
      const interestsJson = await interestsRes.json();

      if (profileJson.success) {
        const p = profileJson.data;
        setFormData({
          fullName: `${p.firstName} ${p.lastName}`,
          username: userJson.success ? (userJson.data.username || "") : "",
        });
        setProfileImage(p.imageUrl?.[0] || "");
        setGymLevel(SKILL_REVERSE[p.skill_level] ?? "Beginner");
        setDiscovery(p.discoveryEnabled ?? false);
        setDistance(p.discoveryRadius ?? 10);
        setPendingDistance(p.discoveryRadius ?? 10);
        setShowMe(p.showGender ?? "Both");

        // Map interest ObjectIds → names
        if (interestsJson.success && Array.isArray(interestsJson.data)) {
          const catalog: Interest[] = interestsJson.data;
          setAllInterests(catalog);
          const selectedNames = (p.interests || [])
            .map((id: string) => catalog.find(i => i._id === id)?.name)
            .filter(Boolean) as string[];
          setInterests(selectedNames);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = useCallback(async (
    field: string,
    data: Record<string, any>
  ) => {
    if (!userId || !token) return;
    setSaving(prev => ({ ...prev, [field]: true }));
    try {
      const res = await fetch(`${API_URL}/api/v1/userProfile/user/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Update failed");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save");
    } finally {
      setSaving(prev => ({ ...prev, [field]: false }));
    }
  }, [userId, token]);

  const saveDistance = () => {
    setDistance(pendingDistance);
    updateProfile("distance", { discoveryRadius: pendingDistance });
  };

  const handleShowMe = (val: ShowMe) => {
    setShowMe(val);
    updateProfile("showMe", { showGender: val });
  };

  const handleGymLevel = (val: GymLevel) => {
    setGymLevel(val);
    updateProfile("gymLevel", { skill_level: SKILL_MAP[val] });
  };

  const handleDiscovery = (val: boolean) => {
    setDiscovery(val);
    updateProfile("discovery", { discoveryEnabled: val });
  };

  const saveInterests = () => {
    const ids = interests
      .map(name => allInterests.find(i => i.name === name)?._id)
      .filter(Boolean) as string[];
    updateProfile("interests", { interests: ids });
  };

  const toggleInterest = (name: string) => {
    if (interests.includes(name)) {
      setInterests(prev => prev.filter(i => i !== name));
    } else if (interests.length < 5) {
      setInterests(prev => [...prev, name]);
    } else {
      Alert.alert("Limit reached", "You can select up to 5 interests.");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to your photo library.");
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
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SavingIndicator = ({ field }: { field: string }) =>
    saving[field] ? <ActivityIndicator size="small" color="#EF4444" /> : null;

  const renderSection = (
    key: keyof typeof expanded,
    title: string,
    icon: React.ReactElement,
    content: React.ReactElement
  ) => (
    <View key={key} className="mb-4">
      <View className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
        <TouchableOpacity className="p-5" onPress={() => toggleExpand(key)}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              {icon}
              <Text className="text-white font-medium text-base">{title}</Text>
            </View>
            <Ionicons
              name={expanded[key] ? "chevron-up" : "chevron-down"}
              size={18}
              color="#A1A1AA"
            />
          </View>
        </TouchableOpacity>
        {expanded[key] && (
          <View className="px-5 pb-5">{content}</View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1">
        <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center mb-6 gap-3">
            <SkeletonBox width={34} height={34} borderRadius={17} />
            <SkeletonBox width={110} height={28} borderRadius={8} />
          </View>

          {/* Profile card */}
          <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 }}>
            <SkeletonBox width={52} height={52} borderRadius={26} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonBox height={16} borderRadius={6} style={{ marginBottom: 8 }} />
              <SkeletonBox width={100} height={12} borderRadius={5} />
            </View>
          </View>

          {/* Discovery toggle row */}
          <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <SkeletonBox height={16} borderRadius={6} style={{ marginBottom: 8 }} />
                <SkeletonBox width={180} height={12} borderRadius={5} />
              </View>
              <SkeletonBox width={50} height={30} borderRadius={15} />
            </View>
          </View>

          {/* Section rows */}
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ backgroundColor: "#1C1C1E", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <SkeletonBox width={24} height={24} borderRadius={6} />
                  <SkeletonBox width={120} height={16} borderRadius={6} />
                </View>
                <SkeletonBox width={20} height={20} borderRadius={5} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1">
      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center mb-6 gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-zinc-800/80 rounded-full"
          >
            <Ionicons name="chevron-back" size={18} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Settings</Text>
        </View>

        {/* Profile card */}
        <TouchableOpacity
          onPress={() => router.push("/(settings)/EditProfileScreen")}
          activeOpacity={0.85}
          className="flex-row items-center mb-5 bg-[#1C1C1E] px-4 py-3 rounded-2xl"
        >
          {/* Avatar */}
          <View className="relative mr-3">
            <Image
              source={profileImage || "https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2"}
              style={{ width: 52, height: 52, borderRadius: 26 }}
            />
            <TouchableOpacity
              onPress={pickImage}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              className="absolute -bottom-0.5 -right-0.5 bg-accent p-1 rounded-full border border-[#09090B]"
            >
              <Ionicons name="camera" size={11} color="white" />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {formData.fullName}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5">@{formData.username}</Text>
          </View>

          {/* Arrow */}
          <Feather name="chevron-right" size={16} color="#52525B" />
        </TouchableOpacity>

        {/* Discovery toggle */}
        <View className="bg-[#1C1C1E] p-5 rounded-2xl mb-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-white font-medium text-base">Enable Discovery</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Find buddies and gyms near you
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <SavingIndicator field="discovery" />
              <Switch
                value={discovery}
                onValueChange={handleDiscovery}
                thumbColor={discovery ? "#fff" : "#f4f3f4"}
                trackColor={{ false: "#3A3A3C", true: "#EF4444" }}
                ios_backgroundColor="#3A3A3C"
              />
            </View>
          </View>
          {discovery && (
            <View className="mt-3 bg-[#2C2C2E] px-4 py-3 rounded-xl">
              <Text className="text-gray-300 text-sm">
                Discovery is on. You'll appear to others within {distance} km.
              </Text>
            </View>
          )}
        </View>

        {/* Distance radius */}
        {renderSection(
          "distance",
          "Discovery Radius",
          <Feather name="map-pin" size={18} color="#EF4444" />,
          <View className="mt-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-sm">Radius</Text>
              <Text className="text-white font-semibold">{pendingDistance} km</Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={pendingDistance}
              onValueChange={setPendingDistance}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#3A3A3C"
              thumbTintColor="#EF4444"
            />
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-500 text-xs">1 km</Text>
              <Text className="text-gray-500 text-xs">50 km</Text>
            </View>
            <TouchableOpacity
              onPress={saveDistance}
              disabled={saving["distance"]}
              className="bg-accent py-3 rounded-xl flex-row justify-center items-center gap-2"
            >
              {saving["distance"]
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text className="text-white font-semibold text-center">Save</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Show Me */}
        {renderSection(
          "showMe",
          "Show Me",
          <Feather name="users" size={18} color="#EF4444" />,
          <View className="mt-3">
            {(["Men", "Women", "Both"] as ShowMe[]).map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => handleShowMe(option)}
                className={`flex-row justify-between items-center py-3 px-4 mb-2 rounded-xl ${
                  showMe === option ? "bg-accent/20" : "bg-[#2C2C2E]"
                }`}
              >
                <Text className="text-white">{option}</Text>
                <View className="flex-row items-center gap-2">
                  {saving["showMe"] && showMe === option && (
                    <ActivityIndicator size="small" color="#EF4444" />
                  )}
                  {showMe === option && (
                    <MaterialIcons name="check-circle" size={20} color="#EF4444" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Gym Level */}
        {renderSection(
          "gymLevel",
          "Fitness Level",
          <FontAwesome5 name="dumbbell" size={16} color="#EF4444" />,
          <View className="mt-3">
            {(["Beginner", "Intermediate", "Professional"] as GymLevel[]).map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => handleGymLevel(level)}
                className={`flex-row justify-between items-center py-3 px-4 mb-2 rounded-xl ${
                  gymLevel === level ? "bg-accent/20" : "bg-[#2C2C2E]"
                }`}
              >
                <Text className="text-white">{level}</Text>
                <View className="flex-row items-center gap-2">
                  {saving["gymLevel"] && gymLevel === level && (
                    <ActivityIndicator size="small" color="#EF4444" />
                  )}
                  {gymLevel === level && (
                    <MaterialIcons name="check-circle" size={20} color="#EF4444" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Interests */}
        {renderSection(
          "interest",
          "Interests",
          <MaterialIcons name="interests" size={20} color="#EF4444" />,
          <View className="mt-4">
            <View className="flex-row flex-wrap">
              {allInterests.map(item => {
                const selected = interests.includes(item.name);
                return (
                  <TouchableOpacity
                    key={item._id}
                    onPress={() => toggleInterest(item.name)}
                    className={`px-4 py-2 mr-2 mb-3 rounded-full ${
                      selected ? "bg-accent" : "bg-[#2C2C2E]"
                    }`}
                  >
                    <Text className={`text-sm ${selected ? "text-white font-medium" : "text-gray-300"}`}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row justify-between items-center mt-1 mb-4">
              <Text className="text-gray-400 text-xs">
                {interests.length}/5 selected
                {interests.length === 5 && (
                  <Text className="text-accent"> – max reached</Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={saveInterests}
              disabled={saving["interests"]}
              className="bg-accent py-3 rounded-xl flex-row justify-center items-center gap-2"
            >
              {saving["interests"]
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text className="text-white font-semibold">Save Interests</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

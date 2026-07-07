import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import GymCard from "../components/GymCard";
import {
  Alert,
  FlatList,
  TouchableOpacity,
  View,
  Text,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SkeletonBox } from "@/app/components/SkeletonBox";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type GymType = {
  _id: string;
  name: string;
  address?: string;
  location?: string;
  imageUrls?: string[];
  rating?: number;
  amenities?: string[];
};

const SavedGyms = () => {
  const [gyms, setGyms] = useState<GymType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tok = await AsyncStorage.getItem("authToken");
        if (!tok) return;
        setToken(tok);
        const decoded = decodeJWT(tok) as any;
        const uid = decoded?.id || decoded?._id;
        if (!uid) return;
        setUserId(uid);
        await loadGyms(uid, tok);
      } catch (err) {
        console.error("savedGym init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadGyms = async (uid: string, tok: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/v1/userProfile/user/${uid}/favorite-gyms`,
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      const json = await res.json();
      if (json.success) setGyms(json.data || []);
    } catch (err) {
      console.error("Failed to load saved gyms:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!userId || !token) return;
    setRefreshing(true);
    await loadGyms(userId, token);
    setRefreshing(false);
  }, [userId, token]);

  const handleUnsave = (gymId: string) => {
    Alert.alert(
      "Remove Gym",
      "Remove this gym from your OG Collection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setGyms((prev) => prev.filter((g) => g._id !== gymId));
            try {
              await fetch(
                `${API_URL}/api/v1/userProfile/user/${userId}/favorite-gym/${gymId}`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            } catch {}
          },
        },
      ]
    );
  };

  const cardWidth = Dimensions.get("window").width - 32;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        {/* Header */}
        <View className="flex-row items-center px-5 pt-6 pb-4 space-x-4">
          <SkeletonBox width={34} height={34} borderRadius={17} />
          <SkeletonBox width={160} height={28} borderRadius={8} style={{ marginLeft: 8 }} />
        </View>

        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              marginHorizontal: 16,
              marginBottom: 32,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "#1C1C1E",
            }}
          >
            <SkeletonBox width={cardWidth} height={220} borderRadius={0} />
            <View style={{ padding: 20 }}>
              <SkeletonBox height={22} borderRadius={6} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <SkeletonBox width={80} height={14} borderRadius={5} />
                <SkeletonBox width={60} height={14} borderRadius={5} />
              </View>
            </View>
          </View>
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* Header — keeps horizontal padding */}
      <View className="flex-row items-center px-5 pt-6 pb-4 space-x-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-zinc-800/80 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl ml-2 font-bold">OG Collection</Text>
      </View>

      {gyms.length > 0 ? (
        /* No horizontal padding here — GymCard handles its own margins */
        <FlatList
          data={gyms}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#EF4444"
            />
          }
          renderItem={({ item }) => (
            <GymCard
              name={item.name}
              images={item.imageUrls?.length ? item.imageUrls : ["https://placehold.co/600x400/1C1C1E/ffffff?text=No+Image"]}
              distance={item.address || item.location || ""}
              rating={item.rating?.toFixed(1) ?? "N/A"}
              reviews={item.rating ? Math.floor(item.rating * 20) : 0}
              isFavorite={true}
              amenities={item.amenities}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(home)/gym-profile",
                  params: { gymId: item._id },
                })
              }
              onFavoritePress={() => handleUnsave(item._id)}
            />
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={56} color="#555" />
          <Text className="text-gray-400 text-center text-base mt-4">
            No gyms in your OG Collection yet.
          </Text>
          <Text className="text-gray-500 text-center text-sm mt-1">
            Tap the heart on any gym to save it here.
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 bg-accent rounded-xl"
            onPress={() => router.push("/(tabs)/(home)/HomeScreen")}
            activeOpacity={0.8}
          >
            <Text className="text-white font-medium">Explore Gyms</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default SavedGyms;

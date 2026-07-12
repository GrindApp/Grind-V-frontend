import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";
import GymCard from "../GymCard";
import { fetchGyms } from "@/apis/gyms";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

type GymListProps = {
  searchQuery?: string;
  categoryFilter?: string | null; // unused — gym schema has no `categories` field
};

const PAGE_SIZE = 10;

const GymList = ({ searchQuery = "", categoryFilter = null }: GymListProps) => {
  const [gyms, setGyms] = useState<GymItemType[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const activeSearch = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  // Load auth + favorite IDs on mount
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

        const res = await fetch(
          `${API_URL}/api/v1/userProfile/user/${uid}/favorite-gym-ids`,
          { headers: { Authorization: `Bearer ${tok}` } }
        );
        const json = await res.json();
        if (json.success) {
          setFavoriteIds(new Set(json.data));
        }
      } catch (err) {
        console.error("GymList init error:", err);
      }
    };
    init();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const toggleFavorite = async (gymId: string) => {
    if (!userId || !token) return;
    const wasSaved = favoriteIds.has(gymId);

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(gymId) : next.add(gymId);
      return next;
    });

    showToast(wasSaved ? "Removed from OG Collection" : "Saved to your OG Collection ❤️");

    try {
      const res = await fetch(
        `${API_URL}/api/v1/userProfile/user/${userId}/favorite-gym/${gymId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (!json.success) {
        // Revert on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(gymId) : next.delete(gymId);
          return next;
        });
      }
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(gymId) : next.delete(gymId);
        return next;
      });
    }
  };

  const loadGyms = async (pageToLoad: number, reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (activeSearch.current.trim()) filters.name = activeSearch.current.trim();
      const data = await fetchGyms({ page: pageToLoad, pageSize: PAGE_SIZE, filters });
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

  // Debounce search — re-fetch from server when searchQuery changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      activeSearch.current = searchQuery;
      loadGyms(1, true);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (!loading && hasMore) loadGyms(page);
  };

  const handleGymPress = (gym: GymItemType) => {
    router.push({
      pathname: "/(tabs)/(home)/gym-profile",
      params: { gymId: gym._id || gym.id },
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
      isFavorite={favoriteIds.has(item._id || item.id)}
      amenities={item.amenities}
      onPress={() => handleGymPress(item)}
      onFavoritePress={() => toggleFavorite(item._id || item.id)}
    />
  );

  return (
    <View>
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text className="text-white text-lg font-medium">Nearby Gyms</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/(home)/all-gyms")}>
          <Text className="text-sm text-gray-400 font-medium">See all</Text>
        </TouchableOpacity>
      </View>

      {gyms.length > 0 ? (
        <View>
          {gyms.map((item, index) => (
            <View key={item._id?.toString() || item.id?.toString() || String(index)}>
              {renderGymItem({ item })}
            </View>
          ))}
          {hasMore ? (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={loading}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-gray-400 text-sm font-medium">Load more gyms</Text>
              )}
            </TouchableOpacity>
          ) : gyms.length > 0 ? (
            <Text className="text-gray-400 text-center py-4">No more gyms to load</Text>
          ) : null}
        </View>
      ) : loading ? (
        <View className="bg-[#262629] rounded-lg mx-4 p-4 items-center">
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-white text-center mt-2">Loading gyms...</Text>
        </View>
      ) : (
        <View className="bg-[#262629] rounded-lg mx-4 p-4 items-center">
          <Text className="text-white text-center">
            {categoryFilter || searchQuery ? "No gyms match your filter" : "No gyms available"}
          </Text>
        </View>
      )}

      {/* Toast */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 24,
          alignSelf: "center",
          backgroundColor: "#1C1C1E",
          borderRadius: 24,
          paddingHorizontal: 18,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          opacity: toastOpacity,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 999,
        }}
      >
        <Ionicons name="heart" size={16} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{toastMsg}</Text>
      </Animated.View>
    </View>
  );
};

export default GymList;

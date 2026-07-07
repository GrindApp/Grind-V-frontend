import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, ImageBackground, StyleSheet, Dimensions,
  Animated, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Heart, Search, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import MuscleBodyMap from "@/app/components/explore/MuscleBodyMap";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 32 - 10) / 2; // 2-col grid with 16px side padding + 10px gap

type WorkoutPlan = {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  durationWeeks: number;
  daysPerWeek: number;
  imageUrl: string;
  tags: string[];
  isSaved: boolean;
  savedCount: number;
};

const DIFF_COLOR: Record<string, string> = {
  Beginner: "#22C55E",
  Intermediate: "#EAB308",
  Advanced: "#EF4444",
};

const ALL = "All";

export default function ExploreScreen() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "ongoing">("all");
  const [category, setCategory] = useState(ALL);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showMuscleMap, setShowMuscleMap] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/v1/explore-workouts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) setPlans(json.data);
    } catch (e) {
      console.error("Failed to fetch plans:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (planId: string) => {
    setSavingId(planId);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/v1/explore-workouts/${planId}/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPlans(prev => prev.map(p =>
          p._id === planId ? { ...p, isSaved: json.isSaved, savedCount: json.savedCount } : p
        ));
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSavingId(null);
    }
  }, []);

  const toggleMuscleMap = useCallback(() => {
    Animated.timing(rotateAnim, {
      toValue: showMuscleMap ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowMuscleMap(v => !v);
  }, [showMuscleMap, rotateAnim]);

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Derive category list from loaded plans
  const categories = useMemo(() => {
    const unique = Array.from(new Set(plans.map(p => p.category)));
    return [ALL, ...unique];
  }, [plans]);

  // Filtered plans based on tab + category + search
  const displayedPlans = useMemo(() => {
    let result = plans;
    if (tab === "ongoing") result = result.filter(p => p.isSaved);
    if (category !== ALL) result = result.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [plans, tab, category, search]);

  const ongoingCount = useMemo(() => plans.filter(p => p.isSaved).length, [plans]);

  const clearSearch = () => { setSearch(""); Keyboard.dismiss(); };

  const PlanCard = ({ item }: { item: WorkoutPlan }) => {
    const isSaving = savingId === item._id;
    const dc = DIFF_COLOR[item.difficulty] ?? "#888";
    return (
      <TouchableOpacity
        style={[s.card, { width: CARD_W }]}
        activeOpacity={0.88}
        onPress={() => router.push({
          pathname: "/(tabs)/(exercise)/explore-plan-detail",
          params: { id: item._id },
        })}
      >
        <ImageBackground
          source={{ uri: item.imageUrl || "https://picsum.photos/id/1016/1600/900" }}
          style={s.cardImg}
          imageStyle={{ borderRadius: 14 }}
        >
          {/* Dark gradient overlay */}
          <View style={s.cardOverlay} />

          {/* Heart button */}
          <TouchableOpacity
            style={s.heartBtn}
            onPress={() => handleSave(item._id)}
            disabled={isSaving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Heart size={16} color={item.isSaved ? "#EF4444" : "#fff"} fill={item.isSaved ? "#EF4444" : "none"} />
            }
          </TouchableOpacity>

          {/* Difficulty badge */}
          <View style={[s.diffBadge, { backgroundColor: dc + "33" }]}>
            <Text style={[s.diffText, { color: dc }]}>{item.difficulty}</Text>
          </View>

          {/* Bottom info */}
          <View style={s.cardBottom}>
            <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={s.cardMeta}>{item.durationWeeks}w · {item.daysPerWeek}d/wk</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Explore</Text>

            {/* Search input */}
            <View style={[s.searchBox, searchFocused && s.searchBoxFocused]}>
              <Search size={16} color={searchFocused ? "#EF4444" : "#555"} />
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search plans, goals, muscles..."
                placeholderTextColor="#555"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={15} color="#555" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Category chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
              style={{ marginBottom: 20 }}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[s.chip, category === cat && s.chipActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.chipText, category === cat && s.chipTextActive]}>
                    {cat === "STRENGTH TRAINING" ? "Strength"
                      : cat === "ENDURANCE TRAINING" ? "Endurance"
                      : cat === "PUSH WORKOUT" ? "Push/Pull"
                      : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Section header + tabs ── */}
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Workout Plans</Text>
              <View style={s.tabPills}>
                <Pressable
                  onPress={() => setTab("all")}
                  style={[s.pill, tab === "all" && s.pillActive]}
                >
                  <Text style={[s.pillText, tab === "all" && s.pillTextActive]}>
                    All{plans.length > 0 ? ` ${plans.length}` : ""}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTab("ongoing")}
                  style={[s.pill, tab === "ongoing" && s.pillActive]}
                >
                  <Text style={[s.pillText, tab === "ongoing" && s.pillTextActive]}>
                    My Plans{ongoingCount > 0 ? ` ${ongoingCount}` : ""}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ── Plans grid ── */}
            {loading ? (
              <View style={s.centered}>
                <ActivityIndicator size="large" color="#EF4444" />
              </View>
            ) : displayedPlans.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>{tab === "ongoing" ? "🏃" : "🔍"}</Text>
                <Text style={s.emptyTitle}>
                  {tab === "ongoing" ? "No ongoing plans" : "No results"}
                </Text>
                <Text style={s.emptyHint}>
                  {tab === "ongoing"
                    ? "Tap ♥ on any plan to add it here"
                    : "Try a different search or category"}
                </Text>
              </View>
            ) : (
              <View style={s.grid}>
                {displayedPlans.map((item, i) => (
                  <PlanCard key={item._id} item={item} />
                ))}
                {/* Phantom spacer if odd number of cards */}
                {displayedPlans.length % 2 !== 0 && (
                  <View style={{ width: CARD_W }} />
                )}
              </View>
            )}

            {/* ── Muscle Map ── */}
            <View style={s.muscleSection}>
              <TouchableOpacity
                onPress={toggleMuscleMap}
                activeOpacity={0.8}
                style={[s.mapToggle, showMuscleMap && s.mapToggleOpen]}
              >
                <View style={s.mapToggleLeft}>
                  <View style={s.mapIcon}>
                    <Text style={{ fontSize: 18 }}>💪</Text>
                  </View>
                  <View>
                    <Text style={s.mapTitle}>Muscle Map</Text>
                    <Text style={s.mapSub}>Tap muscles to find exercises</Text>
                  </View>
                </View>
                <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                  <Ionicons name="chevron-down" size={18} color="#555" />
                </Animated.View>
              </TouchableOpacity>
              {showMuscleMap && (
                <View style={{ marginHorizontal: -16 }}>
                  <MuscleBodyMap onMuscleSelect={() => scrollRef.current?.scrollToEnd({ animated: true })} />
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0B0D" },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 12 },

  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#111318", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: "#1E2124",
  },
  searchBoxFocused: { borderColor: "#EF444466" },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, padding: 0 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },

  chipsRow: { paddingTop: 16, paddingBottom: 2, gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: "#111318", borderWidth: 1, borderColor: "#1E2124",
  },
  chipActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  chipText: { color: "#777", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  sectionRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  tabPills: { flexDirection: "row", backgroundColor: "#111318", borderRadius: 99, padding: 3, borderWidth: 1, borderColor: "#1E2124" },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  pillActive: { backgroundColor: "#EF4444" },
  pillText: { color: "#666", fontSize: 11, fontWeight: "700" },
  pillTextActive: { color: "#fff" },

  grid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28,
  },
  card: { borderRadius: 14, overflow: "hidden" },
  cardImg: { height: 180, justifyContent: "space-between" },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  heartBtn: {
    position: "absolute", top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  diffBadge: {
    position: "absolute", top: 10, left: 10,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  diffText: { fontSize: 9, fontWeight: "800" },
  cardBottom: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  cardTitle: { color: "#fff", fontSize: 13, fontWeight: "800", marginBottom: 3 },
  cardMeta: { color: "#aaa", fontSize: 10 },

  centered: { paddingVertical: 48, alignItems: "center" },
  emptyBox: {
    alignItems: "center", paddingVertical: 40,
    backgroundColor: "#111318", borderRadius: 16,
    borderWidth: 1, borderColor: "#1E2124", marginBottom: 28,
  },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 4 },
  emptyHint: { color: "#555", fontSize: 12 },

  muscleSection: { marginBottom: 16 },
  mapToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#111318", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: "#1E2124",
  },
  mapToggleOpen: { borderColor: "#EF444455" },
  mapToggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  mapIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center",
  },
  mapTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  mapSub: { color: "#555", fontSize: 11, marginTop: 2 },
});

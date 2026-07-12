import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SkeletonBox } from "@/app/components/SkeletonBox";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { decodeJWT } from "@/utils/jwt";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get("window");

type TabType = "requests" | "added";

interface Buddy {
  id: string;
  otherUserId: string;
  name: string;
  image: string;
  status: string;
}

// ─── Card components live outside the screen so FlatList
//     never sees a new component type on re-render ────────────────────────────

type RequestCardProps = {
  item: Buddy;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onPress: (item: Buddy) => void;
};

const RequestCard = ({ item, onAccept, onReject, onPress }: RequestCardProps) => (
  <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.85} style={s.requestCard}>
    <View style={s.requestAvatarWrap}>
      <Image
        source={item.image || "https://placehold.co/100/1C1C1E/fff?text=?"}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    </View>

    <View style={s.requestInfo}>
      <Text style={s.requestName} numberOfLines={1}>{item.name}</Text>
      <View style={s.requestBadge}>
        <MaterialCommunityIcons name="dumbbell" size={11} color="#EF4444" />
        <Text style={s.requestBadgeText}>Wants to be your buddy</Text>
      </View>
    </View>

    <View style={s.requestActions}>
      <TouchableOpacity
        style={s.acceptBtn}
        onPress={() => onAccept(item.otherUserId)}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={16} color="#fff" />
        <Text style={s.acceptBtnText}>Accept</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.rejectBtn}
        onPress={() => onReject(item.otherUserId)}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

type BuddyCardProps = {
  item: Buddy;
  onPress: (item: Buddy) => void;
};

const BuddyCard = ({ item, onPress }: BuddyCardProps) => (
  <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.85} style={s.buddyCard}>
    <View style={s.buddyAvatarWrap}>
      <Image
        source={item.image || "https://placehold.co/100/1C1C1E/fff?text=?"}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    </View>
    <View style={s.buddyInfo}>
      <Text style={s.buddyName} numberOfLines={1}>{item.name}</Text>
      <View style={s.buddyPill}>
        <View style={s.buddyDot} />
        <Text style={s.buddyPillText}>Gym Buddy</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
  </TouchableOpacity>
);

type EmptyStateProps = { tab: TabType };

const EmptyState = ({ tab }: EmptyStateProps) => (
  <View style={s.empty}>
    <View style={s.emptyIcon}>
      <MaterialCommunityIcons
        name={tab === "requests" ? "bell-outline" : "account-group-outline"}
        size={36}
        color="#EF4444"
      />
    </View>
    <Text style={s.emptyTitle}>
      {tab === "requests" ? "No pending requests" : "No buddies yet"}
    </Text>
    <Text style={s.emptySubtitle}>
      {tab === "requests"
        ? "When someone wants to connect, you'll see them here"
        : "Accept requests to build your fitness crew"}
    </Text>
  </View>
);

// ─── Screen ──────────────────────────────────────────────────────────────────

const GymBuddyScreen = () => {
  const [buddies, setBuddies] = useState<{ requests: Buddy[]; added: Buddy[] }>({
    requests: [],
    added: [],
  });
  const [activeTab, setActiveTab] = useState<TabType>("added");
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  // ─── Data fetching ──────────────────────────────────────────────────────
  const fetchPendingRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/v1/friends/requests`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const result = await res.json();
      const requests: Buddy[] = result.data.map((req: any) => ({
        id: req._id,
        otherUserId: req.user1._id,
        name: `${req.user1.firstName} ${req.user1.lastName}`,
        image: req.user1.imageUrl?.[0] ?? "",
        status: req.status,
      }));
      setBuddies((prev) => ({ ...prev, requests }));
    } catch (e) {
      console.error("Error fetching requests:", e);
    }
  };

  const fetchAddedBuddies = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const decoded = decodeJWT(token);
      const currentUserId = decoded?.id || decoded?._id;
      const res = await fetch(`${API_URL}/api/v1/friends/list-friends`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const result = await res.json();
      const added: Buddy[] = result.data.map((friendship: any) => {
        const iAmUser1 = friendship.user1.user?.toString() === currentUserId;
        const other = iAmUser1 ? friendship.user2 : friendship.user1;
        return {
          id: friendship._id,
          otherUserId: other._id,
          name: `${other.firstName} ${other.lastName}`,
          image: other.imageUrl?.[0] ?? "",
          status: friendship.status,
        };
      });
      setBuddies((prev) => ({ ...prev, added }));
    } catch (e) {
      console.error("Error fetching buddies:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPendingRequests(), fetchAddedBuddies()]);
      setLoading(false);
    };
    init();
  }, []);

  const updateRequestStatus = async (otherUserId: string, action: "accepted" | "rejected") => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const endpoint = action === "accepted" ? "accept-request" : "delete-friendship";
      await fetch(`${API_URL}/api/v1/friends/${endpoint}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      setBuddies((prev) => {
        const accepted = prev.requests.find((r) => r.otherUserId === otherUserId);
        return {
          requests: prev.requests.filter((r) => r.otherUserId !== otherUserId),
          added:
            action === "accepted" && accepted
              ? [...prev.added, { ...accepted, status: "accepted" }]
              : prev.added,
        };
      });
    } catch (e) {
      console.error("Error updating request:", e);
    }
  };

  // ─── Tab switch ─────────────────────────────────────────────────────────
  const switchTab = (tab: TabType) => {
    if (tab === activeTab) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(tabAnim, {
        toValue: tab === "added" ? 0 : 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const openProfile = (item: Buddy) => {
    router.push({
      pathname: "/(settings)/buddyProfile",
      params: { profileId: item.otherUserId, friendshipId: item.id, name: item.name, image: item.image, status: item.status },
    });
  };

  const tabHalfW = (width - 32) / 2 - 8;
  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, tabHalfW + 12],
  });

  // Stable renderItem callbacks to avoid re-creating functions on every render
  const renderRequest = ({ item }: { item: Buddy }) => (
    <RequestCard
      item={item}
      onAccept={(id) => updateRequestStatus(id, "accepted")}
      onReject={(id) => updateRequestStatus(id, "rejected")}
      onPress={openProfile}
    />
  );

  const renderBuddy = ({ item }: { item: Buddy }) => (
    <BuddyCard item={item} onPress={openProfile} />
  );

  const requestsEmpty = () => !loading ? <EmptyState tab="requests" /> : null;
  const addedEmpty = () => !loading ? <EmptyState tab="added" /> : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView edges={["top"]} style={s.safeTop}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Buddies</Text>
          <View style={s.headerSpacer} />
        </View>

        {/* Tab bar */}
        <View style={s.tabBar}>
          <Animated.View style={[s.tabIndicator, { left: indicatorLeft, width: tabHalfW }]} />
          {(["added", "requests"] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === "requests" ? buddies.requests.length : buddies.added.length;
            return (
              <TouchableOpacity key={tab} style={s.tabBtn} onPress={() => switchTab(tab)} activeOpacity={0.7}>
                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                  {tab === "requests" ? "Requests" : "My Buddies"}
                </Text>
                {count > 0 && (
                  <View style={[s.tabBadge, isActive && s.tabBadgeActive]}>
                    <Text style={[s.tabBadgeText, isActive && s.tabBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* List — outside SafeAreaView so it fills remaining screen */}
      <Animated.View style={[s.listWrap, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={s.listContent}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={s.skeletonCard}>
                <SkeletonBox width={44} height={44} borderRadius={12} />
                <View style={s.skeletonInfo}>
                  <SkeletonBox height={14} borderRadius={6} style={{ marginBottom: 8 }} />
                  <SkeletonBox height={10} width={120} borderRadius={5} />
                </View>
                <SkeletonBox width={72} height={32} borderRadius={9} />
              </View>
            ))}
          </View>
        ) : activeTab === "requests" ? (
          <FlatList
            key="requests"
            data={buddies.requests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequest}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={requestsEmpty}
          />
        ) : (
          <FlatList
            key="added"
            data={buddies.added}
            keyExtractor={(item) => item.id}
            renderItem={renderBuddy}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={addedEmpty}
          />
        )}
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#09090B" },
  safeTop: { backgroundColor: "#09090B" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 38 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#18181B",
    borderRadius: 14,
    padding: 4,
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 1,
  },
  tabLabel: {
    color: "#71717A",
    fontSize: 14,
    fontWeight: "600",
  },
  tabLabelActive: { color: "#fff" },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  tabBadgeText: { color: "#71717A", fontSize: 11, fontWeight: "700" },
  tabBadgeTextActive: { color: "#fff" },

  // List
  listWrap: { flex: 1 },
  listContent: { paddingTop: 8, paddingBottom: 40 },

  // Request card
  requestCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "#27272A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  requestAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
    marginRight: 10,
  },
  requestInfo: { flex: 1, marginRight: 8 },
  requestName: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 3 },
  requestBadge: { flexDirection: "row", alignItems: "center" },
  requestBadgeText: { color: "#71717A", fontSize: 11, fontWeight: "500", marginLeft: 4 },
  requestActions: { flexDirection: "row", alignItems: "center" },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 5,
  },
  acceptBtnText: { color: "#fff", fontSize: 12, fontWeight: "700", marginLeft: 3 },
  rejectBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#3F3F46",
    alignItems: "center",
    justifyContent: "center",
  },

  // Buddy list
  buddyCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "#27272A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buddyAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
    marginRight: 10,
  },
  buddyInfo: { flex: 1, marginRight: 8 },
  buddyName: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 3 },
  buddyPill: { flexDirection: "row", alignItems: "center" },
  buddyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444", marginRight: 5 },
  buddyPillText: { color: "#71717A", fontSize: 11, fontWeight: "500" },

  // Skeleton
  skeletonCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "#27272A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  skeletonInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  // Empty state
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#E4E4E7",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#52525B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default GymBuddyScreen;

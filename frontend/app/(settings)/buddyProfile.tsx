import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StyleSheet,
  Modal,
  StatusBar,
  FlatList,
} from "react-native";
import { SkeletonBox } from "@/app/components/SkeletonBox";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width: screenWidth, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.52;

const SKILL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Pro",
};

const SKILL_COLORS: Record<string, string> = {
  beginner: "#22C55E",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
};

const GENDER_ICONS: Record<string, any> = {
  male: "male",
  female: "female",
  other: "male-female",
};

type Profile = {
  _id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  imageUrl: string[];
  skill_level?: string;
  gender?: string;
  dateOfBirth?: string;
  interests?: { _id: string; name: string }[];
  user?: { username?: string; email?: string };
};

const BuddyProfile = () => {
  const { profileId, friendshipId, name, image, status } = useLocalSearchParams<{
    profileId: string;
    friendshipId: string;
    name: string;
    image: string;
    status: string;
  }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState(status);
  const [accepting, setAccepting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("No auth token");
        const res = await fetch(
          `${API_URL}/api/v1/userProfile/profile/${profileId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        if (json.success) setProfile(json.data);
      } catch (err) {
        console.error("Failed to load buddy profile:", err);
      } finally {
        setLoading(false);
      }
    };
    if (profileId) fetchProfile();
  }, [profileId]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No auth token");
      const res = await fetch(`${API_URL}/api/v1/friends/accept-request`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otherUserId: profileId }),
      });
      const json = await res.json();
      if (json.success) {
        setFriendStatus("accepted");
      } else {
        Alert.alert("Error", json.message || "Failed to accept request");
      }
    } catch (err) {
      console.error("Accept error:", err);
      Alert.alert("Error", "Failed to accept request");
    } finally {
      setAccepting(false);
    }
  };

  const getAge = (dob?: string) => {
    if (!dob) return null;
    const age = Math.floor(
      (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    return age > 0 ? age : null;
  };

  if (loading) {
    return (
      <View style={styles.root}>
        {/* Hero skeleton */}
        <SkeletonBox height={HERO_HEIGHT} borderRadius={0} />

        {/* Content card skeleton */}
        <View style={[styles.contentCard, { marginTop: -24 }]}>
          {/* Name + age */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <SkeletonBox width={180} height={34} borderRadius={8} />
            <SkeletonBox width={50} height={34} borderRadius={8} />
          </View>

          {/* Badges row */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 28 }}>
            <SkeletonBox width={90} height={28} borderRadius={14} />
            <SkeletonBox width={80} height={28} borderRadius={14} />
            <SkeletonBox width={100} height={28} borderRadius={14} />
          </View>

          {/* Bio block */}
          <View style={{ marginBottom: 28 }}>
            <SkeletonBox width={60} height={12} borderRadius={5} style={{ marginBottom: 10 }} />
            <SkeletonBox height={14} borderRadius={5} style={{ marginBottom: 6 }} />
            <SkeletonBox height={14} borderRadius={5} style={{ marginBottom: 6 }} />
            <SkeletonBox width="60%" height={14} borderRadius={5} />
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flex: 1, backgroundColor: "#18181B", borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#27272A" }}>
                <SkeletonBox width={24} height={24} borderRadius={6} />
                <SkeletonBox width={60} height={14} borderRadius={5} />
                <SkeletonBox width={50} height={10} borderRadius={4} />
              </View>
            ))}
          </View>

          {/* Action button */}
          <SkeletonBox height={52} borderRadius={16} />
        </View>
      </View>
    );
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : name ?? "Buddy";
  const heroImage =
    profile?.imageUrl?.[0] || image || "https://placehold.co/600x800/1C1C1E/ffffff?text=No+Photo";
  const allPhotos = [heroImage, ...(profile?.imageUrl ?? []).slice(1)];
  const extraPhotos = allPhotos.slice(1);
  const username = profile?.user?.username;
  const skillLevel = profile?.skill_level ?? "beginner";
  const age = getAge(profile?.dateOfBirth);
  const interests = profile?.interests ?? [];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ─── Hero Image ─── */}
        <TouchableOpacity activeOpacity={0.95} onPress={() => setLightboxIndex(0)} style={{ height: HERO_HEIGHT }}>
          <Image
            source={heroImage}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.85)"]}
            locations={[0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <SafeAreaView style={styles.headerRow} edges={["top"]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Name + badge overlay at bottom of hero */}
          <View style={styles.heroFooter}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>{displayName}</Text>
              {age && <Text style={styles.heroAge}>{age}</Text>}
            </View>

            <View style={styles.heroBadgeRow}>
              {/* Skill badge */}
              <View
                style={[
                  styles.skillBadge,
                  { backgroundColor: SKILL_COLORS[skillLevel] + "33", borderColor: SKILL_COLORS[skillLevel] },
                ]}
              >
                <FontAwesome5 name="dumbbell" size={10} color={SKILL_COLORS[skillLevel]} />
                <Text style={[styles.skillBadgeText, { color: SKILL_COLORS[skillLevel] }]}>
                  {SKILL_LABELS[skillLevel] ?? skillLevel}
                </Text>
              </View>

              {/* Gender badge */}
              {profile?.gender && (
                <View style={styles.genderBadge}>
                  <Ionicons
                    name={GENDER_ICONS[profile.gender] ?? "person"}
                    size={12}
                    color="#a1a1aa"
                  />
                  <Text style={styles.genderText}>
                    {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                  </Text>
                </View>
              )}

              {/* Username */}
              {username && (
                <View style={styles.genderBadge}>
                  <Ionicons name="at" size={12} color="#a1a1aa" />
                  <Text style={styles.genderText}>{username}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── Content Card ─── */}
        <View style={styles.contentCard}>

          {/* Bio */}
          {profile?.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* Interests */}
          {interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Interests</Text>
              <View style={styles.chipsRow}>
                {interests.map((interest) => (
                  <View key={interest._id} style={styles.chip}>
                    <Text style={styles.chipText}>{interest.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <FontAwesome5 name="dumbbell" size={18} color="#EF4444" />
              <Text style={styles.statValue}>{SKILL_LABELS[skillLevel] ?? "—"}</Text>
              <Text style={styles.statLabel}>Fitness Level</Text>
            </View>
            {age && (
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="cake-variant" size={18} color="#EF4444" />
                <Text style={styles.statValue}>{age}</Text>
                <Text style={styles.statLabel}>Years Old</Text>
              </View>
            )}
            {profile?.gender && (
              <View style={styles.statCard}>
                <Ionicons
                  name={GENDER_ICONS[profile.gender] ?? "person"}
                  size={18}
                  color="#EF4444"
                />
                <Text style={styles.statValue}>
                  {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                </Text>
                <Text style={styles.statLabel}>Gender</Text>
              </View>
            )}
          </View>

          {/* Extra photos grid (all photos after the hero) */}
          {extraPhotos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Photos</Text>
              <View style={styles.photoGrid}>
                {extraPhotos.map((uri, i) => {
                  const GAP = 6;
                  const COLS = extraPhotos.length === 1 ? 1 : 3;
                  const cellW = (screenWidth - 40 - GAP * (COLS - 1)) / COLS;
                  const cellH = COLS === 1 ? cellW * (3 / 4) : cellW * (4 / 3);
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.85}
                      onPress={() => setLightboxIndex(i + 1)}
                      style={{ width: cellW, height: cellH, borderRadius: 12, marginBottom: GAP, overflow: "hidden" }}
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {friendStatus === "pending" ? (
              <TouchableOpacity
                style={styles.acceptBtn}
                activeOpacity={0.85}
                disabled={accepting}
                onPress={handleAccept}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.msgBtnText}>{accepting ? "Accepting…" : "Accept Request"}</Text>
              </TouchableOpacity>
            ) : friendStatus === "accepted" && friendshipId ? (
              <TouchableOpacity
                style={styles.msgBtn}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(chat)/[id]/chatPage",
                    params: { id: friendshipId },
                  })
                }
              >
                <Ionicons name="chatbubble-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.msgBtnText}>Send Message</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ─── Lightbox ─── */}
      <Modal
        visible={lightboxIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxIndex(null)}
        onShow={() => {
          if (lightboxIndex !== null && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: lightboxIndex, animated: false });
          }
        }}
      >
        <StatusBar hidden />
        <View style={styles.lightboxBg}>
          <FlatList
            ref={flatListRef}
            data={allPhotos}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIndex ?? 0}
            getItemLayout={(_, i) => ({ length: screenWidth, offset: screenWidth * i, index: i })}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems[0]) setLightboxIndex(viewableItems[0].index ?? 0);
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setLightboxIndex(null)}
                style={{ width: screenWidth, height: "100%", justifyContent: "center" }}
              >
                <Image
                  source={{ uri: item }}
                  style={{ width: screenWidth, height: screenWidth * (4 / 3) }}
                  contentFit="contain"
                  transition={150}
                />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxIndex(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {allPhotos.length > 1 && (
            <View style={styles.lightboxDots}>
              {allPhotos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, lightboxIndex === i && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#09090B" },
  center: { flex: 1, backgroundColor: "#09090B", alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },

  // Hero
  headerRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  iconBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    padding: 8,
  },
  heroFooter: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 10,
  },
  heroName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroAge: {
    fontSize: 28,
    fontWeight: "300",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  heroBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  genderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genderText: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
  },

  // Content card
  contentCard: {
    backgroundColor: "#09090B",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 28,
    paddingHorizontal: 20,
    minHeight: height * 0.6,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  bioText: {
    color: "#e4e4e7",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "400",
  },

  // Interests chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#3F3F46",
  },
  chipText: {
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: "500",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  statValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  statLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Photos grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  // Lightbox
  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 8,
  },
  lightboxDots: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
    borderRadius: 3,
  },

  // Actions
  actions: {
    marginTop: 4,
    marginBottom: 8,
  },
  acceptBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  msgBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  msgBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default BuddyProfile;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SkeletonBox } from "@/app/components/SkeletonBox";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const MAX_PHOTOS = 6;

const EditProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [formDataState, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
  });

  const [photos, setPhotos] = useState<(string | null)[]>(Array(MAX_PHOTOS).fill(null));
  const bioCharCount = formDataState.bio?.length || 0;
  const MAX_BIO_CHARS = 140;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Token not found");
        const decoded = decodeJWT(token);
        const uid = decoded?.id || decoded?._id;
        if (!uid) throw new Error("User ID not found");
        setUserId(uid);

        const [profileRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/userProfile/user/${uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/v1/user/${uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileJson = await profileRes.json();
        const userJson = await userRes.json();

        if (!profileJson.success) throw new Error(profileJson.message || "Failed to load profile");
        if (!userJson.success) throw new Error(userJson.message || "Failed to load user");

        const userProfile = profileJson.data;
        const userAccount = userJson.data;

        setFormData({
          fullName: `${userProfile.firstName} ${userProfile.lastName}`,
          username: userAccount.username || "",
          bio: userProfile.bio || "",
        });

        const existing = (userProfile.imageUrl ?? []).slice(0, MAX_PHOTOS);
        const slots: (string | null)[] = Array(MAX_PHOTOS).fill(null);
        existing.forEach((url: string, i: number) => { slots[i] = url; });
        setPhotos(slots);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to your photos to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotos(prev => {
        const next = [...prev];
        next[index] = result.assets[0].uri;
        return next;
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const isLocalUri = (uri: string) =>
    uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("/");

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");
      if (!userId) throw new Error("User ID not found");

      const formData = new FormData();
      formData.append("bio", formDataState.bio);

      photos.forEach((photo, i) => {
        if (!photo) return;
        if (isLocalUri(photo)) {
          formData.append(`image_${i}`, {
            uri: photo,
            type: "image/jpeg",
            name: `photo_${i}.jpg`,
          } as any);
        } else {
          formData.append(`existingUrl_${i}`, photo);
        }
      });

      const res = await fetch(`${API_URL}/api/v1/userProfile/user/${userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`);
      }
      if (!json.success) throw new Error(json.message || "Update failed");

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const uploadedCount = photos.filter(Boolean).length;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <ScrollView showsVerticalScrollIndicator={false} className="px-5">
          <View className="flex-row items-center mb-4 space-x-4 mt-2">
            <SkeletonBox width={34} height={34} borderRadius={17} />
            <SkeletonBox width={140} height={28} borderRadius={8} />
          </View>
          <View className="flex-row flex-wrap justify-between mb-6">
            {Array(MAX_PHOTOS).fill(null).map((_, i) => (
              <SkeletonBox key={i} width="31%" height={160} borderRadius={12} style={{ marginBottom: 12 }} />
            ))}
          </View>
          <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, padding: 12, marginBottom: 24 }}>
            {["Full Name", "Username", "Bio"].map((_, i) => (
              <View key={i} style={{ marginBottom: i < 2 ? 24 : 0 }}>
                <SkeletonBox width={90} height={14} borderRadius={6} style={{ marginBottom: 8 }} />
                <SkeletonBox height={48} borderRadius={12} />
              </View>
            ))}
          </View>
          <SkeletonBox height={52} borderRadius={12} style={{ marginTop: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView showsVerticalScrollIndicator={false} className="px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6 space-x-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-zinc-800/80 rounded-full"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Edit Profile</Text>
        </View>

        {/* Photos section */}
        <View className="mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-base font-semibold">Photos</Text>
            <Text className="text-gray-400 text-sm">{uploadedCount}/{MAX_PHOTOS}</Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {photos.map((photo, index) => (
              <View key={index} style={{ width: "31%", aspectRatio: 3 / 4, marginBottom: 10, position: "relative" }}>
                <TouchableOpacity
                  onPress={() => pickImage(index)}
                  activeOpacity={0.8}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: photo ? "rgba(255,255,255,0.2)" : "#374151",
                    backgroundColor: photo ? "transparent" : "#1f2937",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: "center" }}>
                      <Feather name="plus" size={28} color="#9CA3AF" />
                      <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 6, textAlign: "center" }}>
                        {index === 0 ? "Primary" : `Photo ${index + 1}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {photo && (
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                )}

                {index === 0 && (
                  <View style={{
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}>
                    <Text style={{ color: "white", fontSize: 10 }}>Profile</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Form Inputs */}
        <View className="rounded-2xl bg-[#1C1C1E] p-3 mb-6 mt-2">
          <View className="mb-6">
            <Text className="text-gray-300 font-medium mb-2">Full Name</Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              value={formDataState.fullName}
              editable={false}
              className="bg-[#2C2C2E] text-white rounded-xl px-4 py-3.5 text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-300 font-medium mb-2">Username</Text>
            <TextInput
              placeholder="Choose a username"
              placeholderTextColor="#666"
              value={formDataState.username}
              editable={false}
              className="bg-[#2C2C2E] text-white rounded-xl px-4 py-3.5 text-base"
            />
          </View>

          <View>
            <Text className="text-gray-300 font-medium mb-2">Bio</Text>
            <View className="bg-[#2C2C2E] rounded-xl px-4 py-3 relative">
              <TextInput
                placeholder="Write something about yourself"
                placeholderTextColor="#666"
                value={formDataState.bio}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, bio: text.slice(0, MAX_BIO_CHARS) }))
                }
                className="text-white text-base"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text
                className={`absolute bottom-2 right-4 text-xs ${
                  bioCharCount > MAX_BIO_CHARS * 0.8 ? "text-accent" : "text-gray-500"
                }`}
              >
                {bioCharCount}/{MAX_BIO_CHARS}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="py-4 bg-accent rounded-xl items-center shadow"
          onPress={handleSaveChanges}
        >
          <Text className="text-white font-bold tracking-wide text-base">SAVE CHANGES</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

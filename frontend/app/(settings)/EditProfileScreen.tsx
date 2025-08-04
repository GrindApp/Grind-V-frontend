import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";
import { API_URL } from "@env";

const EditProfileScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [formDataState, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
  });

  const [profileImage, setProfileImage] = useState("");
  const [grindImage, setGrindImage] = useState("");
  const bioCharCount = formDataState.bio?.length || 0;
  const MAX_BIO_CHARS = 140;

  // 🔁 Fetch profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Token not found");
        const decoded = decodeJWT(token);
        const userId = decoded?.id || decoded?._id;
        if (!userId) throw new Error("User ID not found");

        const [profileRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/userProfile/user/${userId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/v1/user/${userId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileJson = await profileRes.json();
        const userJson = await userRes.json();

        if (!profileJson.success)
          throw new Error(profileJson.message || "Failed to load profile");
        if (!userJson.success)
          throw new Error(userJson.message || "Failed to load user");

        const userProfile = profileJson.data;
        const userAccount = userJson.data;
        setProfileId(userProfile._id);

        setFormData({
          fullName: `${userProfile.firstName} ${userProfile.lastName}`,
          username: userAccount.username || "",
          bio: userProfile.bio || "",
        });

        setProfileImage(userProfile.imageUrl?.[0] || "");
        setGrindImage(userProfile.imageUrl?.[1] || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
        Alert.alert("Error", err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async (type: "profile" | "grind") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      type === "profile" ? setProfileImage(uri) : setGrindImage(uri);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");
      if (!profileId) throw new Error("Profile ID not found");

      const body = {
        bio: formDataState.bio,
        imageUrl: [profileImage, grindImage].filter(Boolean), // optional
      };

      const res = await fetch(
        `${API_URL}/api/v1/userProfile/user/${profileId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // ✅ Important for JSON
          },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Update failed");

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      console.error("Update error:", err);
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView showsVerticalScrollIndicator={false} className="px-5">
        {/* Header */}
        <View className="flex-row items-center mb-4 space-x-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-zinc-800/80 rounded-full"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Edit Profile</Text>
        </View>

        {/* Images */}
        <View className="flex-row justify-around mb-10">
          {[
            { label: "Profile", image: profileImage, type: "profile" },
            { label: "Grind", image: grindImage, type: "grind" },
          ].map(({ label, image, type }) => (
            <View key={type} className="items-center">
              <View className="relative mb-3">
                <View className="w-32 h-32 rounded-full overflow-hidden border-2 border-accent">
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-white text-xs text-center mt-12">
                      No Image
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  className="absolute bottom-0 right-0 bg-accent p-2 rounded-full shadow"
                  onPress={() => pickImage(type as "profile" | "grind")}
                >
                  <Feather name="camera" size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-300 text-sm">{label} Picture</Text>
            </View>
          ))}
        </View>

        {/* Form Inputs */}
        <View className="rounded-2xl bg-[#1C1C1E] p-3 mb-6">
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

          {/* Bio */}
          <View>
            <Text className="text-gray-300 font-medium mb-2">Bio</Text>
            <View className="bg-[#2C2C2E] rounded-xl px-4 py-3 relative">
              <TextInput
                placeholder="Write something about yourself"
                placeholderTextColor="#666"
                value={formDataState.bio}
                onChangeText={(text) =>
                  handleInputChange("bio", text.slice(0, MAX_BIO_CHARS))
                }
                className="text-white text-base"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text
                className={`absolute bottom-2 right-4 text-xs ${
                  bioCharCount > MAX_BIO_CHARS * 0.8
                    ? "text-accent"
                    : "text-gray-500"
                }`}
              >
                {bioCharCount}/{MAX_BIO_CHARS}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="mt-6 py-4 bg-accent rounded-xl items-center shadow"
          onPress={handleSaveChanges}
        >
          <Text className="text-white font-bold tracking-wide text-base">
            SAVE CHANGES
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

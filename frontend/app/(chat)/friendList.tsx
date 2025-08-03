import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { decodeJWT } from "@/utils/jwt";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FriendList() {
  const [chats, setChats] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Token not found");

        const decoded: any = decodeJWT(token);
        setCurrentUserId(decoded?.id);

        const response = await axios.get(
          "http://172.20.10.4:3000/api/v1/friends/list-friends",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setChats(response.data.data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, []);

  if (!currentUserId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: any) => {
    const otherUser =
      item.user1.user === currentUserId ? item.user2 : item.user1;

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(chat)/[id]/chatPage",
            params: { id: item._id },
          })
        }
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: "#1C1C1E",
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 12,
        }}
      >
        <Image
          source={{ uri: otherUser.imageUrl[0] }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            marginRight: 12,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            {otherUser.firstName} {otherUser.lastName}
          </Text>
          <Text
            style={{
              color: "#8E8E93",
              fontSize: 14,
            }}
          >
            Tap to chat
          </Text>
        </View>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#34C759",
          }}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{
          color: "#8E8E93",
          fontSize: 18,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        No friends yet
      </Text>
      <Text
        style={{
          color: "#8E8E93",
          fontSize: 14,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Add some friends to start chatting
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "#000000",
          borderBottomWidth: 0.5,
          borderBottomColor: "#333",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: "bold",
            marginBottom: 4,
          }}
        >
          Friends
        </Text>
        <Text
          style={{
            color: "#8E8E93",
            fontSize: 16,
          }}
        >
          {chats.length} {chats.length === 1 ? "friend" : "friends"}
        </Text>
      </View>

      {/* Friends List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingVertical: 8,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}
import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const LAST_SEEN_PREFIX = "chatLastSeen_";

type ChatRow = {
  friendshipId: string;
  otherUser: any;
  lastMessage: { content: string; sender: string; createdAt: string } | null;
  isUnread: boolean;
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function FriendList() {
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadChats = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const decoded: any = decodeJWT(token);
      const myId = decoded?.id?.toString();
      setCurrentUserId(myId ?? null);

      // Single request — backend joins friendships + last message in one aggregation
      const res = await fetch(`${API_URL}/api/v1/friends/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { data: conversations = [] } = await res.json();

      // Determine unread status client-side using cached AsyncStorage timestamps
      const chatRows: ChatRow[] = await Promise.all(
        conversations.map(async (conv: any) => {
          const user1Id =
            conv.user1?.user?._id?.toString() ?? conv.user1?.user?.toString();
          const otherUser = user1Id === myId ? conv.user2 : conv.user1;

          let lastMessage: ChatRow["lastMessage"] = null;
          if (conv.lastMessage) {
            lastMessage = {
              content: conv.lastMessage.content ?? "",
              sender: conv.lastMessage.sender?.toString() ?? "",
              createdAt: conv.lastMessage.createdAt,
            };
          }

          let isUnread = false;
          if (lastMessage && lastMessage.sender !== myId) {
            const storedTs = await AsyncStorage.getItem(
              `${LAST_SEEN_PREFIX}${conv._id}`
            );
            const lastSeen = storedTs ? Number(storedTs) : 0;
            isUnread = new Date(lastMessage.createdAt).getTime() > lastSeen;
          }

          return { friendshipId: conv._id, otherUser, lastMessage, isUnread };
        })
      );

      chatRows.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      });

      setRows(chatRows);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadChats(); }, [loadChats]));

  const renderItem = ({ item }: { item: ChatRow }) => {
    const { otherUser, lastMessage, isUnread, friendshipId } = item;
    const avatarUri = otherUser?.imageUrl?.[0];
    const isFromMe = lastMessage?.sender === currentUserId;

    let preview = "No messages yet";
    if (lastMessage) {
      preview = isFromMe ? `You: ${lastMessage.content}` : lastMessage.content;
    }

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/(chat)/[id]/chatPage", params: { id: friendshipId } })
        }
        style={[styles.row, isUnread && styles.rowUnread]}
        activeOpacity={0.75}
      >
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={22} color="#71717A" />
            </View>
          )}
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.textWrap}>
          <View style={styles.topRow}>
            <Text
              style={[styles.name, isUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {otherUser?.firstName} {otherUser?.lastName}
            </Text>
            {lastMessage && (
              <Text style={[styles.time, isUnread && styles.timeUnread]}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <Text
            style={[styles.preview, isUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {preview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSub}>
          {rows.length} {rows.length === 1 ? "conversation" : "conversations"}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.friendshipId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color="#3F3F46" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                Accept a buddy request to start chatting
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#09090B" },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#27272A",
  },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 2 },
  headerSub: { color: "#52525B", fontSize: 14 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 14,
  },
  rowUnread: { backgroundColor: "#18181B" },

  avatarWrap: { position: "relative", marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#18181B",
  },

  textWrap: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  name: { color: "#E4E4E7", fontSize: 15, fontWeight: "500", flex: 1, marginRight: 8 },
  nameUnread: { color: "#fff", fontWeight: "700" },
  time: { color: "#71717A", fontSize: 12 },
  timeUnread: { color: "#EF4444", fontWeight: "600" },
  preview: { color: "#71717A", fontSize: 13 },
  previewUnread: { color: "#A1A1AA", fontWeight: "500" },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { color: "#71717A", fontSize: 18, fontWeight: "600" },
  emptySub: { color: "#52525B", fontSize: 14, textAlign: "center", lineHeight: 20 },
});

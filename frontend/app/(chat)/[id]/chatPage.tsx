import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUnreadMessages } from "@/context/UnreadMessagesContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { decodeJWT } from "@/utils/jwt";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get("window");

export default function ChatPage() {
  const { id: friendshipId } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const { markAsRead } = useUnreadMessages();

  const PAGE_SIZE = 50;

  const normalizeId = (id: any): string => {
    if (typeof id === "object" && id !== null) return id._id || id.id || String(id);
    return String(id);
  };

  const dedupeMessages = (msgs: any[]) => {
    const seen = new Set<string>();
    return msgs.filter((m) => {
      if (!m._id || seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
  };

  const connectSocket = useCallback((token: string) => {
    const socket = io(API_URL!, { auth: { token }, transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("joinRoom", String(friendshipId));
    });

    socket.on("newMessage", (msg: any) => {
      setMessages((prev) => dedupeMessages([...prev, msg]));
    });

    socket.on("chatError", (err: string) => {
      console.error("Socket chat error:", err);
    });

    socketRef.current = socket;
  }, [friendshipId]);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("No token");

        const decoded: any = decodeJWT(token);
        const userId = decoded?.id;
        setCurrentUserId(userId);

        const [friendshipRes, messagesRes] = await Promise.all([
          axios.get(`${API_URL}/api/v1/friends/list-friends`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/v1/messages/${friendshipId}?limit=${PAGE_SIZE}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const friendship = friendshipRes.data.data.find(
          (f: any) => f._id === friendshipId
        );
        if (friendship) {
          const user1Id =
            friendship.user1?.user?._id?.toString() ??
            friendship.user1?.user?.toString();
          const other = user1Id === userId ? friendship.user2 : friendship.user1;
          setOtherUser(other);
        }

        const fetchedMsgs = messagesRes.data;
        setMessages(dedupeMessages(fetchedMsgs));
        setHasEarlier(fetchedMsgs.length === PAGE_SIZE);

        markAsRead(String(friendshipId));
        connectSocket(token);
      } catch (e) {
        console.error("Error initializing chat:", e);
      } finally {
        setInitializing(false);
      }
    };

    init();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [friendshipId]);

  const loadEarlierMessages = async () => {
    if (loadingEarlier || !hasEarlier || messages.length === 0) return;
    setLoadingEarlier(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const oldest = messages[0]?.createdAt;
      const res = await axios.get(
        `${API_URL}/api/v1/messages/${friendshipId}?limit=${PAGE_SIZE}&before=${oldest}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const earlier: any[] = res.data;
      setMessages((prev) => dedupeMessages([...earlier, ...prev]));
      setHasEarlier(earlier.length === PAGE_SIZE);
    } catch (e) {
      console.error("Load earlier error:", e);
    } finally {
      setLoadingEarlier(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!text.trim() || isSending) return;
    const messageText = text.trim();
    setText("");
    setIsSending(true);

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No token");

      const res = await axios.post(
        `${API_URL}/api/v1/messages`,
        { friendshipId, text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Server will also broadcast via socket — dedupeMessages handles the duplicate
      setMessages((prev) => dedupeMessages([...prev, res.data]));
    } catch (e) {
      console.error("Error sending message:", e);
      setText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const shouldShowDateDivider = (index: number) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    const curr = new Date(messages[index].createdAt).toDateString();
    return prev !== curr;
  };

  const shouldShowTime = (index: number) => {
    if (index === messages.length - 1) return true;
    const curr = new Date(messages[index].createdAt).getTime();
    const next = new Date(messages[index + 1].createdAt).getTime();
    return next - curr > 5 * 60 * 1000;
  };

  const getInitials = (user: any) => {
    if (!user) return "?";
    return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  };

  const renderMessage = ({ item, index }: any) => {
    const senderId = normalizeId(item.sender?.user ?? item.sender);
    const isMe = senderId === normalizeId(currentUserId);
    const showDate = shouldShowDateDivider(index);
    const showTime = shouldShowTime(index);

    const prevSenderId =
      index > 0
        ? normalizeId(messages[index - 1].sender?.user ?? messages[index - 1].sender)
        : null;
    const isFirstInGroup = prevSenderId !== senderId;

    return (
      <View>
        {showDate && (
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>
              {formatDateDivider(item.createdAt)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowThem,
          ]}
        >
          {!isMe && (
            <View style={styles.avatarSlot}>
              {isFirstInGroup ? (
                otherUser?.imageUrl?.[0] ? (
                  <Image
                    source={{ uri: otherUser.imageUrl[0] }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(otherUser)}
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.avatarSlot} />
              )}
            </View>
          )}

          <View style={styles.bubbleColumn}>
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
            {showTime && (
              <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeThem]}>
                {formatTime(item.createdAt)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {otherUser?.imageUrl?.[0] ? (
        <Image source={{ uri: otherUser.imageUrl[0] }} style={styles.emptyAvatar} />
      ) : (
        <View style={[styles.emptyAvatar, styles.avatarFallbackLarge]}>
          <Text style={styles.avatarInitialsLarge}>{getInitials(otherUser)}</Text>
        </View>
      )}
      <Text style={styles.emptyName}>
        {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : ""}
      </Text>
      <Text style={styles.emptyHint}>Say hi to your new gym buddy!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          {otherUser?.imageUrl?.[0] ? (
            <Image
              source={{ uri: otherUser.imageUrl[0] }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{getInitials(otherUser)}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUser
              ? `${otherUser.firstName} ${otherUser.lastName}`
              : "Loading..."}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {initializing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#EF4444" size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            renderItem={renderMessage}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={
              hasEarlier ? (
                <TouchableOpacity
                  onPress={loadEarlierMessages}
                  style={styles.loadEarlierBtn}
                  disabled={loadingEarlier}
                >
                  {loadingEarlier ? (
                    <ActivityIndicator size="small" color="#71717A" />
                  ) : (
                    <Text style={styles.loadEarlierText}>Load earlier messages</Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
            contentContainerStyle={[
              styles.messageList,
              messages.length === 0 && { flex: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor="#555"
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || isSending}
            style={[
              styles.sendBtn,
              (!text.trim() || isSending) && styles.sendBtnDisabled,
            ]}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090B" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#09090B",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#27272A",
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerProfile: { position: "relative", marginRight: 10 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  headerInfo: { flex: 1 },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadEarlierBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loadEarlierText: { color: "#71717A", fontSize: 13 },

  messageList: { paddingHorizontal: 12, paddingVertical: 16, gap: 2 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  messageRowMe: { justifyContent: "flex-end" },
  messageRowThem: { justifyContent: "flex-start" },
  avatarSlot: {
    width: 30,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarFallback: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 12, fontWeight: "700" },
  bubbleColumn: { maxWidth: width * 0.72 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMe: {
    backgroundColor: "#EF4444",
    borderBottomRightRadius: 5,
    alignSelf: "flex-end",
  },
  bubbleThem: {
    backgroundColor: "#1C1C1E",
    borderBottomLeftRadius: 5,
    alignSelf: "flex-start",
  },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 21 },
  timeText: { fontSize: 11, color: "#555", marginTop: 3 },
  timeMe: { textAlign: "right", paddingRight: 2 },
  timeThem: { textAlign: "left", paddingLeft: 2 },

  dateDivider: { alignItems: "center", marginVertical: 16 },
  dateDividerText: {
    color: "#71717A",
    fontSize: 12,
    backgroundColor: "#18181B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 60,
  },
  emptyAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 4 },
  avatarFallbackLarge: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialsLarge: { color: "#fff", fontSize: 28, fontWeight: "700" },
  emptyName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  emptyHint: { color: "#555", fontSize: 14 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#09090B",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#27272A",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#18181B",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3F3F46",
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: { color: "#fff", fontSize: 15, lineHeight: 20, minHeight: 20 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#27272A" },
});

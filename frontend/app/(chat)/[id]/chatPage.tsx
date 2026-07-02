import { useEffect, useState, useRef } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { decodeJWT } from "@/utils/jwt";

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
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const normalizeId = (id: any): string => {
    if (typeof id === "object" && id !== null) return id._id || id.id || String(id);
    return String(id);
  };

  const dedupeMessages = (msgs: any[]) => {
    const seen = new Set<string>();
    return msgs.filter(m => {
      if (!m._id || seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
  };

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
          axios.get(`${API_URL}/api/v1/messages/${friendshipId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const friendship = friendshipRes.data.data.find(
          (f: any) => f._id === friendshipId
        );
        if (friendship) {
          const other =
            friendship.user1?.user === userId ? friendship.user2 : friendship.user1;
          setOtherUser(other);
        }

        setMessages(dedupeMessages(messagesRes.data));
      } catch (e) {
        console.error("Error initializing chat:", e);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [friendshipId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!friendshipId || !currentUserId) return;

    const poll = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) return;
        const res = await axios.get(`${API_URL}/api/v1/messages/${friendshipId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.length !== messages.length) setMessages(dedupeMessages(res.data));
      } catch (_) {}
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [friendshipId, currentUserId, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

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
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
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
    return next - curr > 5 * 60 * 1000; // 5 minute gap
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

    const prevSenderId = index > 0
      ? normalizeId(messages[index - 1].sender?.user ?? messages[index - 1].sender)
      : null;
    const isFirstInGroup = prevSenderId !== senderId;

    return (
      <View>
        {showDate && (
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>{formatDateDivider(item.createdAt)}</Text>
          </View>
        )}

        <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
          {/* Avatar for other user — only on first message in a group */}
          {!isMe && (
            <View style={styles.avatarSlot}>
              {isFirstInGroup ? (
                otherUser?.imageUrl?.[0] ? (
                  <Image source={{ uri: otherUser.imageUrl[0] }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{getInitials(otherUser)}</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          {otherUser?.imageUrl?.[0] ? (
            <Image source={{ uri: otherUser.imageUrl[0] }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{getInitials(otherUser)}</Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Loading..."}
          </Text>
          <Text style={styles.headerStatus}>Active now</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {initializing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#A78BFA" size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            renderItem={renderMessage}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.messageList,
              messages.length === 0 && { flex: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
            style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]}
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
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  headerProfile: {
    position: "relative",
    marginRight: 10,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#34C759",
    borderWidth: 2,
    borderColor: "#111",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerStatus: {
    color: "#34C759",
    fontSize: 12,
    marginTop: 1,
  },

  // Messages
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 2,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowThem: {
    justifyContent: "flex-start",
  },
  avatarSlot: {
    width: 30,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarFallback: {
    backgroundColor: "#A78BFA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  bubbleColumn: {
    maxWidth: width * 0.72,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMe: {
    backgroundColor: "#A78BFA",
    borderBottomRightRadius: 5,
    alignSelf: "flex-end",
  },
  bubbleThem: {
    backgroundColor: "#1E1E1E",
    borderBottomLeftRadius: 5,
    alignSelf: "flex-start",
  },
  bubbleText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },
  timeText: {
    fontSize: 11,
    color: "#555",
    marginTop: 3,
  },
  timeMe: {
    textAlign: "right",
    paddingRight: 2,
  },
  timeThem: {
    textAlign: "left",
    paddingLeft: 2,
  },

  // Date divider
  dateDivider: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateDividerText: {
    color: "#444",
    fontSize: 12,
    backgroundColor: "#181818",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 60,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 4,
  },
  avatarFallbackLarge: {
    backgroundColor: "#A78BFA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialsLarge: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  emptyName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyHint: {
    color: "#555",
    fontSize: 14,
  },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 10,
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#222",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333",
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    minHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A78BFA",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#2A2A2A",
  },
});

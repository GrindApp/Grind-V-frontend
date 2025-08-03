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
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { decodeJWT } from "@/utils/jwt";

const { width } = Dimensions.get('window');

export default function ChatPage() {
  const { id: friendshipId } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Get current user ID first, then fetch messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Token not found");

        // Get the actual user ID from JWT token (this should be unique per user)
        const decoded: any = decodeJWT(token);
        const userId = decoded?.id;
        
        console.log("Current user JWT ID:", userId);
        setCurrentUserId(userId);

        // Get friendship details using the same endpoint as FriendList
        const friendshipResponse = await axios.get(
          "http://172.20.10.4:3000/api/v1/friends/list-friends",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Find the specific friendship by ID
        const friendship = friendshipResponse.data.data.find(
          (friend: any) => friend._id === friendshipId
        );

        if (friendship) {
          // Determine the other user using the same logic as FriendList
          const otherUserData = friendship.user1.user === userId ? friendship.user2 : friendship.user1;
          setOtherUser(otherUserData);
        }

        // Fetch messages
        const response = await axios.get(
          `http://172.20.10.4:3000/api/v1/messages/${friendshipId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Message senders:", response.data.map(msg => msg.sender));
        console.log("Current user matches:", response.data.map(msg => ({
          text: msg.text,
          sender: msg.sender,
          isMe: msg.sender === userId
        })));

        setMessages(response.data);
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();
  }, [friendshipId]);

  // Add polling for real-time updates
  useEffect(() => {
    if (!friendshipId || !currentUserId) return;

    const pollMessages = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) return;

        const response = await axios.get(
          `http://172.20.10.4:3000/api/v1/messages/${friendshipId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Only update if we have new messages
        if (response.data.length !== messages.length) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    // Poll every 2 seconds for new messages
    const interval = setInterval(pollMessages, 2000);

    return () => clearInterval(interval);
  }, [friendshipId, currentUserId, messages.length]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    const messageText = text.trim();
    setText(""); // Clear input immediately for better UX

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Token not found");

      const response = await axios.post(
        "http://172.20.10.4:3000/api/v1/messages",
        { friendshipId, text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Sent message response sender:", response.data.sender);
      console.log("Current user ID:", currentUserId);

      // Add the new message to state
      setMessages((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore text if sending failed
      setText(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Helper function to normalize user ID for comparison
  const normalizeUserId = (id: any): string => {
    if (typeof id === 'object' && id !== null) {
      return id._id || id.id || String(id);
    }
    return String(id);
  };

  // Message bubble component
  const renderMessage = ({ item, index }: any) => {
    // Normalize both IDs for comparison
    const messageSenderId = normalizeUserId(item.sender);
    const userId = normalizeUserId(currentUserId);
    const isMe = messageSenderId === userId;
    
    // Debug logging
    console.log(`Message ${index}: "${item.text}"`);
    console.log(`  Raw sender:`, item.sender);
    console.log(`  Normalized sender: "${messageSenderId}"`);
    console.log(`  Normalized user: "${userId}"`);
    console.log(`  Is mine: ${isMe}`);
    console.log('---');

    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTime = !prevMessage || 
      (new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000); // 5 minutes

    return (
      <View style={{ marginBottom: 4 }}>
        {showTime && (
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ 
              color: '#888', 
              fontSize: 12,
              backgroundColor: '#2A2A2A',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        )}
        
        {/* Debug indicator */}
        <View style={{ alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ 
            color: isMe ? '#00FF00' : '#FF0000', 
            fontSize: 10,
            opacity: 0.7
          }}>
            {isMe ? 'ME' : 'THEM'} ({messageSenderId})
          </Text>
        </View>
        
        <View
          style={{
            flexDirection: 'row',
            justifyContent: isMe ? 'flex-end' : 'flex-start',
            marginHorizontal: 12,
          }}
        >
          <View
            style={{
              backgroundColor: isMe ? '#007AFF' : '#3A3A3C',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              maxWidth: width * 0.75,
              borderBottomRightRadius: isMe ? 4 : 20,
              borderBottomLeftRadius: isMe ? 20 : 4,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 1,
              },
              shadowOpacity: 0.22,
              shadowRadius: 2.22,
              elevation: 3,
            }}
          >
            <Text 
              style={{ 
                color: 'white', 
                fontSize: 16,
                lineHeight: 20
              }}
            >
              {item.text}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      {/* Debug info at top */}
      <View style={{ 
        backgroundColor: '#FF0000', 
        padding: 8, 
        alignItems: 'center' 
      }}>
        <Text style={{ color: 'white', fontSize: 12 }}>
          Current User ID: {currentUserId || 'Loading...'}
        </Text>
      </View>

      {/* Chat Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: "#1C1C1E",
          borderBottomWidth: 0.5,
          borderBottomColor: "#333",
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 12,
            padding: 8,
          }}
        >
          <Text style={{ color: "#007AFF", fontSize: 18, fontWeight: "600" }}>
            ← Back
          </Text>
        </TouchableOpacity>

        {otherUser?.imageUrl?.[0] && (
          <Image
            source={{ uri: otherUser.imageUrl[0] }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              marginRight: 12,
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Loading..."}
          </Text>
          <Text
            style={{
              color: "#8E8E93",
              fontSize: 14,
              marginTop: 2,
            }}
          >
            {otherUser ? "Active now" : ""}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ 
            paddingVertical: 10,
            flexGrow: 1,
            justifyContent: 'flex-end'
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Box */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: "#000000",
            borderTopWidth: 0.5,
            borderTopColor: "#333",
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#1C1C1E",
              borderRadius: 20,
              marginRight: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              maxHeight: 100,
            }}
          >
            <TextInput
              style={{
                color: "white",
                fontSize: 16,
                lineHeight: 20,
                minHeight: 20,
              }}
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor="#8E8E93"
              multiline
              textAlignVertical="center"
            />
          </View>
          
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || isLoading}
            style={{
              backgroundColor: (!text.trim() || isLoading) ? "#1C1C1E" : "#007AFF",
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text 
              style={{ 
                color: (!text.trim() || isLoading) ? "#8E8E93" : "white", 
                fontSize: 16,
                fontWeight: "600"
              }}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
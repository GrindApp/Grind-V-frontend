import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@/utils/jwt";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const LAST_SEEN_PREFIX = "chatLastSeen_";

type UnreadContextType = {
  hasUnread: boolean;
  markAsRead: (friendshipId: string) => Promise<void>;
  recheck: () => Promise<void>;
};

const UnreadMessagesContext = createContext<UnreadContextType>({
  hasUnread: false,
  markAsRead: async () => {},
  recheck: async () => {},
});

export const UnreadMessagesProvider = ({ children }: { children: ReactNode }) => {
  const [hasUnread, setHasUnread] = useState(false);

  const recheck = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const decoded = decodeJWT(token);
      const myId = (decoded?.id || decoded?._id)?.toString();
      if (!myId) return;

      const friendsRes = await fetch(`${API_URL}/api/v1/friends/list-friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!friendsRes.ok) return;
      const { data: friendships = [] } = await friendsRes.json();

      const results = await Promise.all(
        friendships.map(async (f: any) => {
          const storedTs = await AsyncStorage.getItem(`${LAST_SEEN_PREFIX}${f._id}`);
          const lastSeen = storedTs ? Number(storedTs) : 0;

          const msgRes = await fetch(`${API_URL}/api/v1/messages/${f._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!msgRes.ok) return false;
          const msgs: any[] = await msgRes.json();
          if (!Array.isArray(msgs) || msgs.length === 0) return false;

          const latest = msgs[msgs.length - 1];
          const latestTs = new Date(latest.createdAt).getTime();
          const senderId =
            typeof latest.sender === "object"
              ? latest.sender?._id?.toString()
              : latest.sender?.toString();

          return latestTs > lastSeen && senderId !== myId;
        })
      );

      setHasUnread(results.some(Boolean));
    } catch (e) {
      console.error("Unread check failed:", e);
    }
  }, []);

  const markAsRead = useCallback(
    async (friendshipId: string) => {
      await AsyncStorage.setItem(`${LAST_SEEN_PREFIX}${friendshipId}`, String(Date.now()));
      await recheck();
    },
    [recheck]
  );

  return (
    <UnreadMessagesContext.Provider value={{ hasUnread, markAsRead, recheck }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

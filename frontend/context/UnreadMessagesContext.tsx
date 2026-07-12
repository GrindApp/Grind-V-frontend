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

  // Uses GET /api/v1/messages/unread-counts — one request instead of 1+N
  const recheck = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const decoded = decodeJWT(token);
      const myId = (decoded?.id || decoded?._id)?.toString();
      if (!myId) return;

      const res = await fetch(`${API_URL}/api/v1/messages/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { data: counts = [] } = await res.json();

      // counts: [{ _id: friendshipId, latestAt, latestSender }]
      const results = await Promise.all(
        counts.map(async (entry: { _id: string; latestAt: string; latestSender: string }) => {
          const senderId = entry.latestSender?.toString();
          if (senderId === myId) return false; // own message, not unread

          const storedTs = await AsyncStorage.getItem(`${LAST_SEEN_PREFIX}${entry._id}`);
          const lastSeen = storedTs ? Number(storedTs) : 0;
          return new Date(entry.latestAt).getTime() > lastSeen;
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

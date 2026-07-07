import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, useFocusEffect } from 'expo-router';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeJWT } from '@/utils/jwt';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

import RatingArenas from '../../components/homepage/RatingArenas';
import CategoryGrid from '../../components/homepage/CategoryGrid';
import GymList from '../../components/homepage/GymList';
import Sidebar from '../../components/sideBar';
import SearchBar from '../../components/SearchBar';
import DailyTasks from '@/app/components/homepage/DailyGoals';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.75; 

const HomeScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { hasUnread, recheck } = useUnreadMessages();

  useFocusEffect(useCallback(() => { recheck(); }, [recheck]));

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('authToken');
        if (!t) return;
        const uid = (decodeJWT(t) as any)?.id;
        if (!uid) return;
        const res = await fetch(`${API_URL}/api/v1/user-tasks/streak/${uid}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        if (data.success) setStreak(data.data.streak);
      } catch {}
    })();
  }, []);

  const sections = useMemo(() => [
    { key: 'activity', render: () => <DailyTasks /> },
    { key: 'rating', render: () => <RatingArenas /> },
    { key: 'category', render: () => <CategoryGrid onSelect={setSelectedCategory} /> },
    { key: 'gyms', render: () => <GymList searchQuery={searchQuery} categoryFilter={selectedCategory} /> },
  ], [searchQuery, selectedCategory]);

  const animateSidebar = useCallback((open: boolean) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: open ? 0 : -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: open ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    animateSidebar(isSidebarOpen);
  }, [isSidebarOpen]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 5,
    onPanResponderMove: (_, gesture) => {
      const dx = Math.min(0, gesture.dx);
      slideAnim.setValue(dx);
      fadeAnim.setValue(1 + dx / SIDEBAR_WIDTH);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -SIDEBAR_WIDTH * 0.3) {
        setIsSidebarOpen(false);
      } else {
        animateSidebar(true);
      }
    }
  }), []);

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const renderHeader = useCallback(() => (
    <View className="bg-primary">
      <View className="flex-row items-center px-2 py-2.5 bg-[#99999] rounded-b-lg shadow">
        <TouchableOpacity
          onPress={() => setIsSidebarOpen(true)}
          className="p-1.5 mr-2"
        >
          <Ionicons name="menu" size={22} color="white" />
        </TouchableOpacity>

        <View className="flex-1 mx-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search gyms, facilities..."
            onSubmit={handleSearch}
          />
        </View>

        {streak > 0 && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 2,
            backgroundColor: '#1A1A1A', borderRadius: 20,
            paddingHorizontal: 8, paddingVertical: 4, marginHorizontal: 4,
          }}>
            <Text style={{ fontSize: 13 }}>🔥</Text>
            <Text style={{ color: '#FACC15', fontSize: 12, fontWeight: '800' }}>{streak}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push("/(chat)/friendList")}
          className="p-1.5 ml-1"
          style={{ position: 'relative' }}
        >
          <Ionicons name="chatbubble-outline" size={22} color="white" />
          {hasUnread && (
            <View style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: '#EF4444',
              borderWidth: 1.5,
              borderColor: '#09090B',
            }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  ), [searchQuery, streak]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {renderHeader()}

      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View className="mb-2 px-1">{item.render()}</View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={4}
        removeClippedSubviews
      />

      {/* Sidebar & Blur Overlay */}
      {isSidebarOpen && (
        <>
          <Animated.View
            className="absolute inset-0 z-10"
            style={{ opacity: fadeAnim }}
            pointerEvents="auto"
          >
            <BlurView intensity={40} tint="dark" className="absolute inset-0">
              <TouchableOpacity
                className="absolute inset-0"
                onPress={() => setIsSidebarOpen(false)}
                activeOpacity={1}
              />
            </BlurView>
          </Animated.View>

          <Animated.View
            className="absolute top-0 left-0 h-full z-20 shadow-lg"
            style={{ width: SIDEBAR_WIDTH, transform: [{ translateX: slideAnim }] }}
            {...panResponder.panHandlers}
          >
            <View className="absolute right-0 top-0 bottom-0 w-4 items-center justify-center">
              <View className="h-10 w-1 bg-white/20 rounded-full" />
            </View>
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
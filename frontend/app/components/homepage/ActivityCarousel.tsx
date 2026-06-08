import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, Dimensions, TouchableOpacity, ScrollView,
  FlatList, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
// import Carousel from 'react-native-reanimated-carousel'; // ❌ NOT compatible with Expo Go — requires custom native build
// import { PieChart } from 'react-native-gifted-charts';   // ❌ NOT compatible with Expo Go — requires custom native build
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ─── Donut chart replacement for PieChart from react-native-gifted-charts ───
// Uses concentric Views + border tricks — no native deps required.
const DonutChart = ({
  progress = 0.23,
  radius = 54,
  strokeWidth = 18,
}: {
  progress?: number;
  radius?: number;
  strokeWidth?: number;
}) => {
  const size = radius * 2;
  // We fake a donut with two half-circle masks — works on all RN versions.
  const deg = Math.round(progress * 360);
  const firstHalfDeg = Math.min(deg, 180);
  const secondHalfDeg = Math.max(deg - 180, 0);

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {/* Track circle */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: radius,
        borderWidth: strokeWidth, borderColor: '#22D3EE',
      }} />
      {/* Filled arc — first 180° */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: radius, overflow: 'hidden',
      }}>
        <View style={{
          width: size / 2, height: size, backgroundColor: 'transparent',
          position: 'absolute', left: size / 2,
          transform: [{ rotate: `${firstHalfDeg}deg` }],
          transformOrigin: `${-size / 2}px 50%`,
        }} />
      </View>
      {/* Red overlay for filled portion */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: radius,
        borderWidth: strokeWidth, borderColor: '#EF4444',
        // clip everything past the progress angle using border trick
        opacity: progress > 0 ? 1 : 0,
        // simple approximation: show as partial ring via rotation
        transform: [{ rotate: `-${90}deg` }],
        borderRightColor: progress < 0.25 ? '#EF4444' : 'transparent',
        borderBottomColor: progress < 0.5 ? '#EF4444' : 'transparent',
        borderLeftColor: progress < 0.75 ? '#EF4444' : 'transparent',
        borderTopColor: '#EF4444',
      }} />
      {/* Inner circle (hole) */}
      <View style={{
        width: size - strokeWidth * 2, height: size - strokeWidth * 2,
        borderRadius: radius - strokeWidth, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>23%</Text>
        <Text style={{ color: '#A1A1AA', fontSize: 10 }}>complete</Text>
      </View>
    </View>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const goals = [
  "Complete 30 hamstring stretches",
  "15 minutes of neck exercises",
  "Core back strengthening routine",
  "Waist twists (3 sets of 20)",
  "Hand grip exercises (5 minutes)",
  "Shoulder mobility series"
];

const ActivitySlider: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [checkedGoals, setCheckedGoals] = useState<string[]>(['Hamstring', 'Back']);
  const flatListRef = useRef<FlatList>(null);

  const toggleGoal = useCallback((goal: string) => {
    setCheckedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(idx);
  };

  const renderHeader = useCallback((title: string, subtitle: string, rightElement?: React.ReactNode) => (
    <View className="flex-row justify-between items-center mb-6">
      <View>
        <Text className="text-white text-lg font-bold mb-1">{title}</Text>
        <Text className="text-zinc-400 text-sm">{subtitle}</Text>
      </View>
      {rightElement}
    </View>
  ), []);

  const DailyActivityCard = useMemo(() => (
    <View style={{ width }} className="px-4">
      <View className="bg-zinc-900 p-6 rounded-3xl shadow-xl h-[320px] justify-between">
        {renderHeader('Daily Activity', 'Steps & Calories',
          <TouchableOpacity className="bg-zinc-800 rounded-full p-2">
            <Ionicons name="ellipsis-horizontal" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        )}
        <View className="flex-row justify-between items-center mb-6">
          <View className="items-center w-[48%]">
            {/* Replaced PieChart — react-native-gifted-charts not available in Expo Go */}
            <DonutChart progress={0.23} radius={54} strokeWidth={18} />
          </View>
          <View className="w-[48%] pl-4 space-y-5 border-l border-zinc-800">
            <View><Text className="text-zinc-400 text-xs mb-1">Target Steps</Text><Text className="text-white font-bold text-base">30,000</Text></View>
            <View><Text className="text-zinc-400 text-xs mb-1">Remaining</Text><Text className="text-white font-bold text-base">7,000</Text></View>
            <View><Text className="text-zinc-400 text-xs mb-1">Calories Burned</Text><Text className="text-white font-bold text-base">1,230 kcal</Text></View>
          </View>
        </View>
        <View className="flex-row justify-center items-center mb-4 space-x-6">
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 bg-red-500 rounded-full" />
            <Text className="text-zinc-200 text-xs ml-1">Steps</Text>
          </View>
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 bg-cyan-400 rounded-full" />
            <Text className="text-zinc-200 text-xs ml-1">Remaining</Text>
          </View>
        </View>
        <Text className="text-yellow-400 text-sm font-semibold text-center">
          You have achieved 25% of your goal in 3 days
        </Text>
      </View>
    </View>
  ), [renderHeader]);

  const WeeklyGoalsCard = useMemo(() => (
    <View style={{ width }} className="px-4">
      <View className="bg-zinc-900 p-6 rounded-3xl shadow-xl h-[320px] justify-between">
        {renderHeader('Daily Goals', 'Track your fitness targets',
          <TouchableOpacity className="bg-zinc-800 rounded-full p-2">
            <Ionicons name="ellipsis-horizontal" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        )}
        <ScrollView className="flex-1 my-2">
          <View className="flex-row flex-wrap">
            {goals.map((goal, idx) => {
              const selected = checkedGoals.includes(goal);
              return (
                <TouchableOpacity
                  key={idx}
                  className={`rounded-lg px-2.5 py-1.5 mr-1.5 mb-1.5 flex-row items-center ${
                    selected ? 'bg-red-500/10 border border-red-500' : 'bg-zinc-800'
                  }`}
                  onPress={() => toggleGoal(goal)}
                >
                  {selected && (
                    <Ionicons name="checkmark-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  )}
                  <Text className={`text-xs ${selected ? 'text-red-500 font-semibold' : 'text-zinc-200'}`}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <View className="mt-2">
          <View className="h-2 bg-zinc-800 rounded-full w-full mb-1.5 overflow-hidden">
            <LinearGradient
              colors={['#EF4444', '#F97316']}
              style={{ width: '33%', height: '100%' }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-zinc-300 text-xs">Day 2 of 6</Text>
            <Text className="text-red-500 text-xs font-semibold">33% Complete</Text>
          </View>
          <Text className="text-center text-zinc-400 text-xs mt-1">6 days remaining</Text>
        </View>
      </View>
    </View>
  ), [checkedGoals, renderHeader, toggleGoal]);

  const TrackProgressionCard = useMemo(() => (
    <View style={{ width }} className="px-4">
      <View className="bg-zinc-900 p-6 rounded-3xl shadow-xl h-[320px] justify-between">
        {renderHeader('Track Progression', 'Daily exercise completion',
          <View className="bg-red-500 px-3.5 py-1.5 rounded-xl">
            <Text className="text-white font-bold text-base">25%</Text>
          </View>
        )}
        <View className="items-center mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="checkmark-circle" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text className="text-white text-base font-medium">5 of 12 exercise tasks</Text>
          </View>
          <Text className="text-zinc-400 text-sm">completed successfully</Text>
        </View>
        <View className="mt-auto">
          <Text className="text-white font-semibold text-base mb-4">Daily Progression</Text>
          <View className="flex-row flex-wrap">
            {[...Array(8)].map((_, idx) => (
              <View
                key={idx}
                className={clsx('w-9 h-9 rounded-lg mr-2 mb-2 justify-center items-center',
                  idx < 5 ? 'bg-red-500' : 'bg-zinc-800')}
              >
                <Text className={clsx('font-semibold', idx < 5 ? 'text-white' : 'text-zinc-500')}>
                  {idx + 1}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-center text-zinc-400 text-xs mt-3">4/8 Days Completed</Text>
        </View>
      </View>
    </View>
  ), [renderHeader]);

  const CARDS = useMemo(
    () => [DailyActivityCard, WeeklyGoalsCard, TrackProgressionCard],
    [DailyActivityCard, WeeklyGoalsCard, TrackProgressionCard]
  );

  return (
    <View className="mt-4">
      {/* Replaced react-native-reanimated-carousel with FlatList + pagingEnabled */}
      <FlatList
        ref={flatListRef}
        data={CARDS}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        renderItem={({ item }) => item}
        style={{ height: 360 }}
      />

      {/* Pagination dots */}
      <View className="flex-row justify-center mt-2 space-x-2">
        {[0, 1, 2].map((idx) => (
          <View
            key={idx}
            style={{
              height: 4,
              borderRadius: 2,
              width: activeSlide === idx ? 24 : 8,
              backgroundColor: activeSlide === idx ? '#EF4444' : '#52525B',
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default ActivitySlider;
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const pieData = [
  { value: 23000, color: '#EF4444', text: '23%' },
  { value: 77000, color: '#22D3EE', text: '77%' },
];

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

  const toggleGoal = useCallback((goal: string) => {
    setCheckedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  }, []);

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
    <View className="bg-zinc-900 mx-4 p-6 rounded-3xl shadow-xl h-[320px] justify-between">
      {renderHeader('Daily Activity', 'Steps & Calories',
        <TouchableOpacity className="bg-zinc-800 rounded-full p-2">
          <Ionicons name="ellipsis-horizontal" size={18} color="#A1A1AA" />
        </TouchableOpacity>
      )}
      <View className="flex-row justify-between items-center mb-6">
        <View className="items-center w-[48%]">
          <PieChart
            data={pieData}
            donut
            textColor="white"
            radius={54}
            innerRadius={36}
            innerCircleColor="#1E1B26"
            textSize={12}
            centerLabelComponent={() => (
              <View className="items-center justify-center">
                <Text className="text-white text-lg font-bold">23%</Text>
                <Text className="text-zinc-400 text-xs">complete</Text>
              </View>
            )}
          />
        </View>
        <View className="w-[48%] pl-4 space-y-5 border-l border-zinc-800">
          <View><Text className="text-zinc-400 text-xs mb-1">Target Steps</Text><Text className="text-white font-bold text-base">30,000</Text></View>
          <View><Text className="text-zinc-400 text-xs mb-1">Remaining</Text><Text className="text-white font-bold text-base">7,000</Text></View>
          <View><Text className="text-zinc-400 text-xs mb-1">Calories Burned</Text><Text className="text-white font-bold text-base">1,230 kcal</Text></View>
        </View>
      </View>
      <View className="flex-row justify-center items-center mb-4 space-x-6">
        <View className="flex-row items-center space-x-2 mr-4">
          <View className="w-3 h-3 bg-red-500 rounded-full" />
          <Text className="text-zinc-200 text-xs ml-1">Steps</Text>
        </View>
        <View className="flex-row items-center space-x-2 mr-4">
          <View className="w-3 h-3 bg-cyan-400 rounded-full" />
          <Text className="text-zinc-200 text-xs ml-1">Remaining</Text>
        </View>
      </View>
      <Text className="text-yellow-400 text-sm font-semibold text-center">
        You have achieved 25% of your goal in 3 days
      </Text>
    </View>
  ), [renderHeader]);

  const WeeklyGoalsCard = useMemo(() => (
    <View className="bg-zinc-900 mx-4 p-6 rounded-3xl shadow-xl h-[320px] justify-between">
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
                  <Ionicons name="checkmark-circle" size={14} color="#EF4444" className="mr-1" />
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
        <Text className="text-center text-zinc-400 text-xs mt-1">
          6 days remaining
        </Text>
      </View>
    </View>
  ), [checkedGoals, goals, renderHeader, toggleGoal]);

  const TrackProgressionCard = useMemo(() => (
    <View className="bg-zinc-900 mx-4 p-6 rounded-3xl shadow-xl h-[320px] justify-between">
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
  ), [renderHeader]);

  const CARDS = useMemo(() => [DailyActivityCard, WeeklyGoalsCard, TrackProgressionCard], [DailyActivityCard, WeeklyGoalsCard, TrackProgressionCard]);

  return (
    <View className="mt-4">
  <Carousel
    loop
    pagingEnabled
    snapEnabled
    width={width}
    height={360}
    autoPlay={false}
    data={CARDS}
    scrollAnimationDuration={400}
    onProgressChange={(_, absoluteProgress) => setActiveSlide(Math.round(absoluteProgress) % 3)}
    renderItem={({ item }) => item}
  />

  <View className="flex-row justify-center mt-2 space-x-2">
    {[0, 1, 2].map((idx) => (
      <View
        key={idx}
        className={clsx(
          'h-1 rounded-full transition-all duration-200',
          activeSlide === idx ? 'w-6 bg-red-500' : 'w-2 bg-zinc-600'
        )}
      />
    ))}
  </View>
</View>
  );
};

export default ActivitySlider;
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ActivitySlider from '@/app/components/homepage/ActivityCarousel';

const { width } = Dimensions.get('window');

const FitnessProgressScreen = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('Week');
  
  // Example workout data
  const workoutData = [
    {
      date: 'Apr 23, 2025',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12, completed: true },
        { name: 'Squats', sets: 4, reps: 15, completed: true },
        { name: 'Hamstring Stretch', duration: '5 min', completed: true },
      ],
      steps: 9870,
      calories: 320,
      duration: '45 min'
    },
    {
      date: 'Apr 21, 2025',
      exercises: [
        { name: 'Pull-ups', sets: 3, reps: 8, completed: true },
        { name: 'Lunges', sets: 3, reps: 10, completed: true },
        { name: 'Shoulder Press', sets: 3, reps: 12, completed: false },
      ],
      steps: 8540,
      calories: 280,
      duration: '38 min'
    },
    {
      date: 'Apr 19, 2025',
      exercises: [
        { name: 'Deadlifts', sets: 4, reps: 8, completed: true },
        { name: 'Planks', duration: '3 min', completed: true },
        { name: 'Running', duration: '20 min', completed: true },
      ],
      steps: 12450,
      calories: 450,
      duration: '65 min'
    }
  ];

  const weeklyStats = {
    workoutsCompleted: 3,
    totalWorkouts: 5,
    totalTime: '148 min',
    totalCalories: 1050,
    totalSteps: 30860
  };

  const renderSectionHeader = (title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined, subtitle: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined, rightElement: string | number | boolean | React.JSX.Element | Iterable<React.ReactNode> | null | undefined) => (
    <View className="flex-row justify-between items-center mb-4">
      <View>
        <Text className="text-white text-lg font-bold">{title}</Text>
        {subtitle && <Text className="text-zinc-400 text-sm mt-1">{subtitle}</Text>}
      </View>
      {rightElement}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-zinc-400 text-sm">Your Progress</Text>
          <Text className="text-white text-2xl font-bold mt-1">Fitness Dashboard</Text>
        </View>

        {/* Activity Carousel */}
        <ActivitySlider />

        {/* Timeframe Selector */}
        <View className="px-5 mt-8 mb-6">
          <View className="flex-row justify-between bg-zinc-900 rounded-xl p-1">
            {['Week', 'Month', 'Year'].map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                onPress={() => setActiveTimeframe(timeframe)}
                className={`py-2.5 px-4 rounded-lg flex-1 items-center ${
                  activeTimeframe === timeframe ? 'bg-red-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`font-medium ${
                    activeTimeframe === timeframe ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Summary */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)}
          className="px-5 mb-8"
        >
          {renderSectionHeader('Weekly Summary', 'Last 7 days performance', null)}
          <View className="bg-zinc-900 rounded-2xl shadow-lg shadow-black/30 overflow-hidden">
            <LinearGradient 
              colors={['#EF4444', '#F97316']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              className="px-5 py-4"
            >
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-white opacity-80 text-sm">Completion Rate</Text>
                  <Text className="text-white text-2xl font-bold mt-1">
                    {Math.round((weeklyStats.workoutsCompleted / weeklyStats.totalWorkouts) * 100)}%
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-white opacity-80 text-sm">Total Workouts</Text>
                  <Text className="text-white text-2xl font-bold mt-1">
                    {weeklyStats.workoutsCompleted}/{weeklyStats.totalWorkouts}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            <View className="px-5 py-4">
              <View className="flex-row justify-between mb-3">
                <View className="w-1/3">
                  <Text className="text-zinc-400 text-xs mb-1">Total Time</Text>
                  <Text className="text-white font-bold">{weeklyStats.totalTime}</Text>
                </View>
                <View className="w-1/3 items-center">
                  <Text className="text-zinc-400 text-xs mb-1">Calories</Text>
                  <Text className="text-white font-bold">{weeklyStats.totalCalories} kcal</Text>
                </View>
                <View className="w-1/3 items-end">
                  <Text className="text-zinc-400 text-xs mb-1">Steps</Text>
                  <Text className="text-white font-bold">{weeklyStats.totalSteps.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Workout History */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          className="px-5 mb-6"
        >
          {renderSectionHeader('Workout History', 'Your recent activities', 
            <TouchableOpacity className="bg-zinc-800 px-3 py-1.5 rounded-lg">
              <Text className="text-zinc-300 text-sm">View All</Text>
            </TouchableOpacity>
          )}
          
          {workoutData.map((workout, index) => (
            <View key={index} className="bg-zinc-900 rounded-2xl p-5 mb-4 shadow-lg shadow-black/30">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-base font-semibold">{workout.date}</Text>
                <View className="flex-row items-center bg-zinc-800 px-2.5 py-1 rounded-lg">
                  <Ionicons name="time-outline" size={14} color="#EF4444" />
                  <Text className="text-white text-xs ml-1">{workout.duration}</Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-zinc-400 text-xs mb-2">Exercises</Text>
                {workout.exercises.map((exercise, exIndex) => (
                  <View key={exIndex} className="flex-row items-center mb-2 last:mb-0">
                    <View className={`w-3 h-3 rounded-full mr-2 ${exercise.completed ? 'bg-green-500' : 'bg-zinc-500'}`} />
                    <Text className="text-white text-sm flex-1">{exercise.name}</Text>
                    <Text className="text-zinc-400 text-xs">
                      {exercise.sets && exercise.reps 
                        ? `${exercise.sets} × ${exercise.reps}` 
                        : exercise.duration}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between pt-3 border-t border-zinc-800">
                <View className="flex-row items-center">
                  <Ionicons name="footsteps" size={16} color="#f43f5e" />
                  <Text className="text-zinc-300 text-xs ml-1">{workout.steps.toLocaleString()} steps</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="flame-outline" size={16} color="#f43f5e" />
                  <Text className="text-zinc-300 text-xs ml-1">{workout.calories} kcal</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Body Measurements */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5 mb-8"
        >
          {renderSectionHeader('Body Measurements', 'Track your progress', null)}
          <View className="bg-zinc-900 rounded-2xl p-5 shadow-lg shadow-black/30">
            <View className="flex-row justify-between mb-4">
              <View className="w-1/2 pr-2">
                <Text className="text-zinc-400 text-xs mb-1">Weight</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-lg font-bold">72.5</Text>
                  <Text className="text-zinc-400 text-xs ml-1">kg</Text>
                  <View className="flex-row items-center ml-2">
                    <Ionicons name="arrow-down" size={14} color="#10B981" />
                    <Text className="text-green-500 text-xs">1.2</Text>
                  </View>
                </View>
              </View>
              <View className="w-1/2 pl-2 border-l border-zinc-800">
                <Text className="text-zinc-400 text-xs mb-1">Body Fat</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-lg font-bold">18.2</Text>
                  <Text className="text-zinc-400 text-xs ml-1">%</Text>
                  <View className="flex-row items-center ml-2">
                    <Ionicons name="arrow-down" size={14} color="#10B981" />
                    <Text className="text-green-500 text-xs">0.8</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between pt-4 border-t border-zinc-800">
              <View className="w-1/3">
                <Text className="text-zinc-400 text-xs mb-1">Chest</Text>
                <Text className="text-white text-sm">95 cm</Text>
              </View>
              <View className="w-1/3">
                <Text className="text-zinc-400 text-xs mb-1">Waist</Text>
                <Text className="text-white text-sm">82 cm</Text>
              </View>
              <View className="w-1/3">
                <Text className="text-zinc-400 text-xs mb-1">Arms</Text>
                <Text className="text-white text-sm">36 cm</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FitnessProgressScreen;
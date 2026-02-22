import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ExerciseDetailScreen = () => {
  const navigation = useNavigation();
  const [saved, setSaved] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState('Intermediate');
  
  const steps = [
    "Start seated on the floor with your legs extended in front of you.",
    "Keep your back straight, breathe deeply, and bend forward from your hips.",
    "Reach for your toes, but don't strain. Feel the stretch along the backs of your legs.",
    "Hold the position for 20-30 seconds without bouncing.",
    "Release slowly and repeat 2-3 times."
  ];
  
  const tips = [
    "Keep your back straight throughout the stretch",
    "Don't bounce during the stretch",
    "Breathe deeply and relax into the position"
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header with back button and options */}
        <View className="px-4 flex-row justify-between items-center pt-2 pb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="p-2 bg-zinc-800/80 rounded-full"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>
          
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="p-2 bg-zinc-800/80 rounded-full"
              onPress={() => setSaved(!saved)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={saved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={saved ? "#f43f5e" : "white"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="p-2 bg-zinc-800/80 rounded-full"
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main Image with gradient overlay */}
        <Animated.View 
          entering={FadeIn.duration(400)}
          className="px-5 mb-8"
        >
          <View className="w-full overflow-hidden rounded-3xl shadow-lg shadow-black/50">
            <Image
              source={'https://picsum.photos/id/1015/1600/900'}
              style={{ height: 240, width: '100%' }}
              contentFit="cover"
              transition={500}
            />
            
            {/* Title Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.95)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View className="absolute bottom-0 left-0 right-0 px-6 pb-6">
                <Text className="text-white text-2xl font-bold" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}>
                  Hamstring Stretch
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="flex-row items-center bg-black/40 px-2.5 py-1.5 rounded-full">
                    <Ionicons name="time-outline" size={14} color="#f43f5e" />
                    <Text className="text-white text-xs ml-1 font-medium">2-3 minutes</Text>
                  </View>
                  <View className="h-2 w-2 bg-gray-500 rounded-full mx-3" />
                  <View className="bg-black/40 px-2.5 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">{currentDifficulty}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Content Sections */}
        <View className="px-5 space-y-7">
          {/* Difficulty Selector */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(400)}
            className="bg-zinc-900 rounded-xl p-3"
          >
            <Text className="text-white text-sm font-medium mb-2.5 px-1">Difficulty Level</Text>
            <View className="flex-row justify-between">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setCurrentDifficulty(level)}
                  className={`py-2 px-3 rounded-lg ${
                    currentDifficulty === level ? 'bg-red-600' : 'bg-zinc-800'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text 
                    className={`text-xs font-medium ${
                      currentDifficulty === level ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Purpose Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View className="flex-row items-center mb-2.5">
              <View className="w-1 h-5 bg-red-600 rounded-full mr-2" />
              <Text className="text-white text-lg font-semibold">Benefits</Text>
            </View>
            <View className="bg-zinc-900 rounded-xl p-4">
              <Text className="text-gray-300 text-sm leading-relaxed">
                Hamstring stretches reduce tension in the back of the legs, improve posture, and increase flexibility for better performance in workouts. Regular stretching can help prevent injuries and relieve lower back pain.
              </Text>
            </View>
          </Animated.View>

          {/* Instructions Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View className="flex-row items-center mb-2.5">
              <View className="w-1 h-5 bg-red-600 rounded-full mr-2" />
              <Text className="text-white text-lg font-semibold">Steps</Text>
            </View>
            <View className="bg-zinc-900 rounded-xl p-4">
              {steps.map((step, index) => (
                <View key={index} className="flex-row mb-3 last:mb-0">
                  <View className="bg-red-600 w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-300 text-sm leading-relaxed">
                      {step}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Tips Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <View className="flex-row items-center mb-2.5">
              <View className="w-1 h-5 bg-red-600 rounded-full mr-2" />
              <Text className="text-white text-lg font-semibold">Expert Tips</Text>
            </View>
            <View className="bg-zinc-900 rounded-xl p-4">
              {tips.map((tip, index) => (
                <View key={index} className="flex-row items-start mb-2.5 last:mb-0">
                  <Ionicons name="bulb-outline" size={18} color="#f43f5e" className="mt-0.5" />
                  <Text className="text-gray-300 text-sm leading-relaxed ml-2.5 flex-1">
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Muscles Worked */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View className="flex-row items-center mb-2.5">
              <View className="w-1 h-5 bg-red-600 rounded-full mr-2" />
              <Text className="text-white text-lg font-semibold">Muscles Worked</Text>
            </View>
            <View className="flex-row space-x-2">
              {['Hamstrings', 'Lower back', 'Calves'].map((muscle, index) => (
                <View key={index} className="bg-zinc-900 px-3 py-2 rounded-lg">
                  <Text className="text-gray-300 text-xs">{muscle}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="bottom-8 left-0 right-0 px-5">
        <TouchableOpacity 
          className="bg-red-600 py-3.5 rounded-xl items-center shadow-lg shadow-red-900/30"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">
            Start Exercise
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ExerciseDetailScreen;
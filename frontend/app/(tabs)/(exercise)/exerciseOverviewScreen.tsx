import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const stretches = [
  'Hamstring Stretches',
  'Back Stretches',
  'Neck Stretches',
  'Shoulder Stretches',
  'Waist Stretches',
  'Hand Stretches',
];

const ExerciseOverviewScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView 
        className="flex-1 bg-primary" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Cover Image with Gradient */}
        <View className="relative h-72 overflow-hidden mb-4">
          <ImageBackground
            source={{ uri: 'https://picsum.photos/id/1015/1600/900' }}
            className="h-full w-full"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              className="absolute inset-0"
            />
            
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-4 left-4 z-10 p-2 bg-black/30 rounded-full"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>

            {/* Heading */}
            <View className="absolute bottom-0 px-6 py-6 w-full">
              <Text className="text-white text-3xl font-bold leading-tight">
                Stretching{'\n'}Exercises
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Main Content */}
        <View className="px-5 space-y-8">
          {/* Benefits Card */}
          <View className="bg-zinc-800/70 rounded-2xl px-5 py-4 shadow-sm shadow-black/40">
            <Text className="text-white text-lg font-semibold mb-2">
              Benefits of Stretching
            </Text>
            <Text className="text-gray-300 text-sm leading-relaxed">
              Stretching helps improve flexibility, blood circulation, and reduces risk of injuries. 
              It can also enhance recovery, improve posture, and decrease muscle soreness.
            </Text>
          </View>

          {/* Explore Section */}
          <View>
            <Text className="text-white text-lg font-semibold mb-3 px-1">
              Explore the Exercises
            </Text>
            <View className="space-y-2.5">
              {stretches.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(`/exercise-details/:id`)}
                  className="bg-zinc-800 rounded-xl px-4 py-3.5 flex-row justify-between items-center shadow-sm shadow-black/40"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className="w-1.5 h-8 bg-red-600 rounded-full mr-3" />
                    <Text className="text-white text-base font-medium">{item}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#888" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Types Card */}
          <View className="bg-zinc-800/70 rounded-2xl px-5 py-4 shadow-sm shadow-black/40">
            <Text className="text-white text-lg font-semibold mb-2">
              Types of Stretches
            </Text>
            <Text className="text-gray-300 text-sm leading-relaxed">
              There are various types like static, dynamic, and passive stretches. Each serves a different purpose and suits different fitness levels and goals.
            </Text>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity 
            className="bg-red-600 rounded-xl py-4 items-center shadow-md shadow-red-800/40 mx-3 mt-4"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base tracking-wider uppercase">
              Subscribe @29rupee/month
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExerciseOverviewScreen;
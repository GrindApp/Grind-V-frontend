import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GymCard from '@/app/components/GymCard';

const ratingGyms = [
  {
    id: '1',
    name: 'Martial Art and Strength Zone',
    images: [
      'https://picsum.photos/600/400',
      'https://picsum.photos/600/401',
      'https://picsum.photos/600/402',
      'https://picsum.photos/600/403',
      'https://picsum.photos/600/404',
    ],
    distance: '500 meters away',
    rating: '5.0',
    tags: ['#Strength', '#MartialArts', '#Crossfit'],
  },
  {
    id: '2',
    name: 'Planet Fitness',
    images: [
      'https://source.unsplash.com/600x400/?planet-fitness',
      'https://source.unsplash.com/600x400/?cardio,gym',
      'https://source.unsplash.com/600x400/?zumba',
      'https://source.unsplash.com/600x400/?fitness-class',
      'https://source.unsplash.com/600x400/?indoor-gym',
    ],
    distance: '500 meters away',
    rating: '5.0',
    tags: ['#Cardio', '#WeightTraining', '#Zumba'],
  },
  {
    id: '3',
    name: 'The Ultimate Muscle Gym',
    images: [
      'https://source.unsplash.com/600x400/?muscle,gym',
      'https://source.unsplash.com/600x400/?bodybuilding',
      'https://source.unsplash.com/600x400/?gym-equipment',
      'https://source.unsplash.com/600x400/?weights',
      'https://source.unsplash.com/600x400/?workout-room',
    ],
    distance: '500 meters away',
    rating: '5.0',
    tags: ['#Bodybuilding', '#Powerlifting', '#Machines'],
  },
];

const RatingArenasPage = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E] px-4">
    
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">5 ⭐ Rating Arenas</Text>
        <View className="w-6" />
      </View>

      {/* Gym List using GymCard */}
      <FlatList
        data={ratingGyms}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GymCard
            name={item.name}
            images={item.images}
            distance={item.distance}
            rating={item.rating}
            tags={item.tags}
            price='₹999/mo'
            onPress={() => {
              // optional: handle navigation or open modal
            }}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default RatingArenasPage;

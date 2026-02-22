import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import clsx from 'clsx';

const { width } = Dimensions.get('window');
const GAP = 12;
const PADDING_HORIZONTAL = 24;
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - GAP * 3) / 4;

const categories = [
  {
    id: '1',
    label: 'Weight Training',
    icon: <FontAwesome5 name="dumbbell" size={20} color="#fff" />,
  },
  {
    id: '2',
    label: 'Cardio Training',
    icon: <MaterialCommunityIcons name="run-fast" size={22} color="#fff" />,
  },
  {
    id: '3',
    label: 'Athletics',
    icon: <MaterialCommunityIcons name="karate" size={22} color="#fff" />,
  },
  {
    id: '4',
    label: 'Recreational',
    icon: <MaterialCommunityIcons name="basketball" size={22} color="#fff" />,
  },
  {
    id: '5',
    label: 'Aerobic/Dance',
    icon: <MaterialCommunityIcons name="music-circle" size={22} color="#fff" />,
  },
  {
    id: '6',
    label: 'Collaborative',
    icon: <MaterialCommunityIcons name="account-group" size={22} color="#fff" />,
  },
  {
    id: '7',
    label: 'Yoga/Relaxation',
    icon: <MaterialCommunityIcons name="meditation" size={22} color="#fff" />,
  },
  {
    id: '8',
    label: 'Nutrition Training',
    icon: <MaterialCommunityIcons name="food-apple" size={22} color="#fff" />,
  },
];

const CategoryGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedCategory((prev) => (prev === id ? null : id));
  };

  return (
    <View className="my-6 px-6">
  <Text className="text-white text-xl font-bold mb-4">Your Type</Text>

  <FlatList
    key="horizontal" // Add this key to force a fresh render
    data={categories}
    horizontal
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item) => item.id}
    contentContainerStyle={{
      paddingTop: 6,
      paddingBottom: 8,
      paddingRight: 20
    }}
    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
    renderItem={({ item }) => {
      const isSelected = selectedCategory === item.id;

      return (
        <TouchableOpacity
          className={clsx(
            'items-center justify-center rounded-2xl',
            isSelected ? 'border-2 border-white' : 'border border-transparent'
          )}
          style={{
            width: CARD_WIDTH,
            paddingVertical: 14,
            paddingHorizontal: 8,
            backgroundColor: '#23262B',
          }}
          activeOpacity={0.85}
          onPress={() => handleSelect(item.id)}
        >
          <View
            style={{
              backgroundColor: '#888A8C80',
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            {item.icon}
          </View>
          <Text className="text-white text-xs text-center font-medium leading-tight">
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    }}
  />
</View>
  );
};

export default CategoryGrid;

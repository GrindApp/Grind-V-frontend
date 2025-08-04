import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { API_URL } from '@env';

type Interest = {
  _id: string;
  name: string;
};

const MAX_SELECTIONS = 5;

const TagsScreen = () => {
  const router = useRouter();
const { onboardingData, updateOnboardingData } = useOnboarding();
  const [maxLimitReached, setMaxLimitReached] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await fetch( `${API_URL}/api/v1/interests`);
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          setInterests(result.data);
        } else {
          Alert.alert('Error', 'Failed to load interests.');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not fetch interests.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  useEffect(() => {
    setMaxLimitReached(selectedTags.length >= MAX_SELECTIONS);
  }, [selectedTags]);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagId));
    } else {
      if (selectedTags.length < MAX_SELECTIONS) {
        setSelectedTags([...selectedTags, tagId]);
      }
    }
  };

  const handleNext = () => {
    if (selectedTags.length > 0) {
      updateOnboardingData({ interests: selectedTags });
      console.log("Current context data", onboardingData)
      router.push('/photos_screen'); // go to next screen
    } else {
      Alert.alert('Select at least one interest');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" />
      
      <View className="flex-1 px-6 py-6">
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleBack}
          className="w-10 h-10 rounded-full mb-6 flex items-center justify-center"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-white text-3xl font-bold">
            What are you into?
          </Text>
          <Text className="text-gray-300 mt-2">
            Select activities you enjoy or want to try
          </Text>
          
          <View className="flex-row items-center mt-4 justify-between">
            <View className="flex-row items-center">
              <Text className="text-gray-300 text-sm">
                Selected: {selectedTags.length}/{MAX_SELECTIONS}
              </Text>
              <View className="flex-row ml-2 items-center bg-white/20 px-3 py-1 rounded-full">
                <Ionicons name="information-circle-outline" size={16} color="#ddd" />
                <Text className="text-gray-300 text-xs ml-1">
                  {selectedTags.length === 0 ? "Pick at least one" : ""}
                  {maxLimitReached ? "Max limit reached" : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags */}
        <ScrollView 
          className="flex-1 mb-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="flex-row flex-wrap">
            {loading ? (
  <ActivityIndicator size="large" color="#ffffff" className="mt-8" />
) : (
  interests.map((tag) => {
    const selected = selectedTags.includes(tag._id);
    const disabled = maxLimitReached && !selected;

    return (
      <TouchableOpacity
        key={tag._id}
        onPress={() => toggleTag(tag._id)}
        activeOpacity={disabled ? 1 : 0.7}
        className={`px-4 py-3 rounded-full mr-3 mb-3 ${
          selected
            ? 'bg-accent'
            : disabled
              ? 'bg-gray-800/50 border border-gray-800'
              : 'bg-gray-800 border border-gray-700'
        }`}
      >
        <Text
          className={`font-medium ${
            selected
              ? 'text-white'
              : disabled
                ? 'text-gray-500'
                : 'text-white'
          }`}
        >
          {tag.name}
        </Text>
      </TouchableOpacity>
    );
  })
)}

          </View>
          
          {maxLimitReached && (
            <View className="mt-2 mb-4 px-2">
              <Text className="text-yellow-300 text-xs flex-row items-center">
                <Ionicons name="alert-circle" size={12} color="#F9D949" /> You've reached the maximum of {MAX_SELECTIONS} selections. Deselect an item to choose another.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Next Button */}
        <View className="mt-auto pt-2">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              selectedTags.length > 0 ? 'bg-accent' : 'bg-gray-700'
            }`}
            onPress={handleNext}
            disabled={selectedTags.length === 0}
            activeOpacity={0.8}
          >
            <Text 
              className={`text-center font-bold text-lg ${
                selectedTags.length > 0 ? 'text-white' : 'text-gray-400'
              }`}
            >
              Continue
            </Text>
          </TouchableOpacity>
          
          <Text className="text-center text-gray-400 text-xs mt-3">
            Don't worry, you can update these preferences in your profile settings later.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TagsScreen;
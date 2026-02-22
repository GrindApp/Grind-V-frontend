import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HouseRulesScreen = () => {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    if (accepted) {
      router.push('/name');
    } else {
      alert('You must accept the rules to continue.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-white text-4xl font-bold">Welcome to</Text>
            <Text className="text-red-500 text-5xl font-extrabold">GRIND</Text>
            <Text className="text-gray-400 text-lg mt-4">
              Before you get started, please read and accept our house rules.
            </Text>
          </View>

          {/* Rules Card */}
          <View className="bg-gray-800 rounded-2xl p-6 mb-8">
            <Text className="text-white text-xl font-bold mb-4">House Rules</Text>
            
            {[
              'Respect all members at all times.',
              'No spam or self-promotion.',
              'Be honest about your fitness level.',
              'Use appropriate language and photos.',
              'Report inappropriate behavior immediately.',
              'This is a community. Lift each other up!',
            ].map((rule, index) => (
              <View key={index} className="flex-row items-center mb-4">
                <View className="w-2 h-2 rounded-full bg-emerald-400 mr-3" />
                <Text className="text-white text-base flex-1">{rule}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="bg-primary px-6 py-6 ">
        <TouchableOpacity
          className={`flex-row items-center mb-6 ${accepted ? 'opacity-100' : 'opacity-80'}`}
          onPress={() => setAccepted(!accepted)}
        >
          <View className={`w-6 h-6 rounded mr-3 items-center justify-center ${accepted ? 'bg-emerald-400' : 'border border-gray-400'}`}>
            {accepted && <Ionicons name="checkmark" size={18} color="black" />}
          </View>
          <Text className="text-white text-base">
            I agree to follow all house rules
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`py-4 rounded-xl ${accepted ? 'bg-white' : 'bg-gray-700'}`}
          onPress={handleContinue}
          disabled={!accepted}
        >
          <Text className={`text-center font-bold text-lg ${accepted ? 'text-gray-900' : 'text-gray-500'}`}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HouseRulesScreen;
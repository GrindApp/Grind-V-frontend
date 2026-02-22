import { NavigationProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const EmailScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (email.includes('@')) {
      navigation.navigate('HouseRules');
    } else {
      alert('Enter a valid email address');
    }
  };

  return (
    <View className="flex-1 bg-primary px-6 justify-center">
      <Text className="text-white text-2xl font-bold mb-4">What's your email?</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#9CA3AF"
        className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg mb-6"
        keyboardType="email-address"
      />
      <TouchableOpacity className="bg-white py-3 rounded-lg" onPress={handleNext}>
        <Text className="text-center text-black font-semibold">Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = process.env.EXPO_PUBLIC_API_URL;

const UsernameScreen: React.FC = () => {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const [username, setUsername] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleRegister = async () => {
    const trimmed = username.trim();

    if (!trimmed || trimmed.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          username: trimmed,
        }),
      });

      const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(data?.message || 'Registration failed.');
}

const { user, token } = data.data;

// ✅ Store token however your app stores it elsewhere for email login
await AsyncStorage.setItem('authToken', token);

router.push('/(onboarding)/house_rules');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-primary px-6 justify-center">
        <Text className="text-white text-lg mb-2">CHOOSE A USERNAME</Text>
        <Text className="text-gray-400 mb-6">
          This is how others will see you on Grind.
        </Text>

        <View className="border-b border-gray-700 mb-6 pb-2">
          <TextInput
            className="text-white text-lg"
            placeholder="USERNAME"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={submitting}
          className={`border border-white py-3 rounded-md ${submitting ? 'opacity-50' : ''}`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-center tracking-widest">CONTINUE</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default UsernameScreen;
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useOnboarding } from "@/context/OnboardingContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NameScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const { updateOnboardingData } = useOnboarding();

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleNext = () => {
    if (isValid) {
      updateOnboardingData({ firstName, lastName });
      router.push('/dob');
    } else {
      alert('Please enter both your first and last name.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="bg-primary"
    >
      <StatusBar barStyle="light-content" />
      <Pressable className="flex-1" onPress={() => Keyboard.dismiss()}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6 py-8">
            {/* Back Button */}
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full mb-6 flex items-center justify-center"
            >
              <Ionicons name="chevron-back" size={28} color="#999999" />
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-12">
              <Text className="text-white text-3xl font-bold">What's your name?</Text>
              <Text className="text-secondary mt-2">
                This helps us personalize your experience
              </Text>
            </View>

            {/* Inputs */}
            <View className="mb-6">
              <Text className="text-secondary mb-2 text-sm font-medium">First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="#6B7280"
                className={`border-b pb-2 text-white ${focusedField === 'first' ? 'border-accent' : 'border-secondary border-opacity-50'}`}
                autoFocus
                autoCapitalize="words"
                style={{ color: 'white' }}
                onFocus={() => setFocusedField('first')}
                onBlur={() => setFocusedField(null)}
              />

              <Text className="text-secondary mb-2 text-sm font-medium mt-6">Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor="#6B7280"
                className={`border-b pb-2 text-white ${focusedField === 'last' ? 'border-accent' : 'border-secondary border-opacity-50'}`}
                autoCapitalize="words"
                style={{ color: 'white' }}
                onFocus={() => setFocusedField('last')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Continue Button */}
            <View className="mt-auto">
              <TouchableOpacity
                className={`py-4 rounded-xl ${isValid ? 'bg-accent' : 'bg-secondary bg-opacity-20'}`}
                onPress={handleNext}
                disabled={!isValid}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center font-bold text-lg ${
                    isValid ? 'text-white' : 'text-secondary'
                  }`}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </View>
  );
};

export default NameScreen;
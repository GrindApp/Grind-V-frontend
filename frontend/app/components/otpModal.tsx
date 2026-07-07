import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface OtpModalProps {
  visible: boolean;
  onClose: () => void;
  phoneNumber?: string;
}

const OtpModal: React.FC<OtpModalProps> = ({ visible, onClose, phoneNumber = '+91 ••• ••• 4789' }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const inputRefs = useRef<Array<RNTextInput | null>>([]);
  const router = useRouter();

  useEffect(() => {
    if (visible) resetOtp();
  }, [visible]);

  useEffect(() => {
    if (visible && timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [visible, timer]);

  useEffect(() => {
    if (otp.every((digit) => digit !== '')) {
      verifyOtp();
    }
  }, [otp]);

  const resetOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setTimer(30);
    setLoading(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 250);
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      // Paste or buffered multi-char input — fill forward from current box
      const digits = cleaned.slice(0, 6 - index).split('');
      setOtp(prev => {
        const next = [...prev];
        digits.forEach((d, i) => { next[index + i] = d; });
        return next;
      });
      const lastFilled = Math.min(index + digits.length - 1, 5);
      inputRefs.current[lastFilled]?.focus();
    } else {
      // Single digit — functional updater avoids stale state on fast taps
      setOtp(prev => {
        const next = [...prev];
        next[index] = cleaned;
        return next;
      });
      if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

 const verifyOtp = async () => {
  if (loading) return;
  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber, otp: otp.join('') }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data?.message || 'Verification failed.');
    }

    onClose();

    if (data.data.isNewUser) {
      // ✅ New user — go collect username
      router.push({
        pathname: '/(onboarding)/username',
        params: { phoneNumber },
      });
    } else {
      // ✅ Existing user — already logged in, store token and skip onboarding
      await AsyncStorage.setItem('authToken', data.data.token);
      router.replace("/(tabs)/(home)/HomeScreen");
    }
  } catch (error: any) {
    Alert.alert('Verification Failed', error.message || 'The OTP you entered is incorrect. Please try again.');
    resetOtp();
  } finally {
    setLoading(false);
  }
};

  const resendOtp = async () => {
    if (timer > 0) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to resend OTP.');
      }

      Alert.alert('OTP Sent', 'A new verification code has been sent to your mobile number.');
      setTimer(30);
      resetOtp();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not resend OTP. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <View className="bg-zinc-900 w-full rounded-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-zinc-800 px-6 py-4 flex-row justify-between items-center">
            <Text className="text-white font-bold text-lg">Verify Phone</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-zinc-700 items-center justify-center"
            >
              <Ionicons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="p-6">
            <Text className="text-zinc-400 mb-1">A verification code has been sent to</Text>
            <Text className="text-white text-base font-medium mb-6">{phoneNumber}</Text>

            <Text className="text-white font-medium mb-3">Enter 6-digit OTP</Text>

            {/* OTP Input Fields */}
            <View className="flex-row justify-between mb-6">
              {otp.map((digit, index) => (
                <View key={index} className="relative">
                  <TextInput
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(-1)}
                    autoFocus={index === 0 && visible}
                    selectionColor="#FF3B30"
                    className={`w-12 h-14 text-white text-center text-xl font-bold rounded-lg 
                    ${Platform.OS === 'ios' ? 'pt-1' : ''} 
                    ${digit ? 'bg-zinc-800' : 'bg-zinc-800/50'} 
                    ${focusedIndex === index ? 'border-2 border-red-500' : 'border border-zinc-700'}`}
                  />
                  {digit && (
                    <View className="absolute bottom-0 left-3 right-3 h-1 bg-red-500 rounded-t-full" />
                  )}
                </View>
              ))}
            </View>

            {/* Timer and Resend */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-center mb-2">
                {timer > 0 ? `Resend code in ${timer} seconds` : "Didn't receive the code?"}
              </Text>
              <TouchableOpacity
                disabled={timer > 0}
                onPress={resendOtp}
                className={`py-3 px-6 rounded-lg ${timer > 0 ? 'bg-zinc-800' : 'bg-zinc-800 border border-red-500'}`}
              >
                <Text className={`text-center font-medium ${timer > 0 ? 'text-zinc-500' : 'text-red-500'}`}>
                  RESEND OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={verifyOtp}
              disabled={!otp.every((digit) => digit !== '') || loading}
              className={`py-3 rounded-lg ${otp.every((digit) => digit !== '') ? 'bg-red-500' : 'bg-zinc-800'}`}
            >
              <Text className="text-white text-center font-bold">VERIFY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View className="absolute inset-0 bg-black/70 justify-center items-center">
            <View className="bg-zinc-800 px-6 py-5 rounded-xl items-center">
              <ActivityIndicator size="large" color="#FF3B30" />
              <Text className="text-white font-medium mt-3">Verifying OTP...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default OtpModal;
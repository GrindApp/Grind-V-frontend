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

import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import OtpModal from '../components/otpModal';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const PhoneNumberScreen: React.FC = () => {
  const [phone, setPhone] = useState<string>('');
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);

  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState<string>('91');
  const [country, setCountry] = useState<Country | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);


  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country);
  };

  const fullPhoneNumber = `+${callingCode}${phone}`;

 const handleSendOtp = async () => {
  if (!phone || phone.length < 6) {
    Alert.alert('Invalid Number', 'Please enter a valid mobile number.');
    return;
  }

  setSendingOtp(true);
  try {
    // ✅ Step 1: check if phone exists
    const checkRes = await fetch(`${API_URL}/api/v1/auth/check-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhoneNumber }),
    });
    const checkData = await checkRes.json();
    if (!checkRes.ok) throw new Error(checkData?.message || 'Failed to check phone.');

    setIsExistingUser(checkData.data.exists);

    // ✅ Step 2: send OTP either way
    const otpRes = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhoneNumber }),
    });
    const otpData = await otpRes.json();
    if (!otpRes.ok) throw new Error(otpData?.message || 'Failed to send OTP.');

    setShowOtp(true);
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
  } finally {
    setSendingOtp(false);
  }
};
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-primary px-6 justify-center">
        <Text className="text-white text-lg mb-4">LOG IN WITH MOBILE</Text>

        <Text className="text-gray-400 mb-1">PREFIX</Text>
        <View className="flex-row items-center border-b border-gray-700 mb-4 pb-2">
          <CountryPicker
            withFlag
            withCallingCode
            withFilter
            countryCode={countryCode}
            onSelect={onSelect}
            containerButtonStyle={{ marginRight: 10 }}
            theme={{ backgroundColor: '#000000', onBackgroundTextColor: '#ffffff' }}
          />
          <Text className="text-white mr-2">+{callingCode}</Text>
          <TextInput
            className="text-white flex-1"
            placeholder="MOBILE NUMBER"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          onPress={handleSendOtp}
          disabled={sendingOtp}
          className={`border border-white py-3 rounded-md ${sendingOtp ? 'opacity-50' : ''}`}
        >
          {sendingOtp ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
<Text className="text-white text-center tracking-widest">
  {isExistingUser === null ? 'CONTINUE' : isExistingUser ? 'LOG IN' : 'CREATE ACCOUNT'}
</Text>          )}
        </TouchableOpacity>

        <Text className="text-gray-500 text-xs text-center mt-6">
          By creating an account, you are agreeing to our{' '}
          <Text className="underline">Terms & Conditions</Text> and{' '}
          <Text className="underline">Privacy Policy!</Text>
        </Text>

        <OtpModal
          visible={showOtp}
          onClose={() => setShowOtp(false)}
          phoneNumber={fullPhoneNumber}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default PhoneNumberScreen;
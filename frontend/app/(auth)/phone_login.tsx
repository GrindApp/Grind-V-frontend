import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import OtpModal from '../components/otpModal';

const PhoneNumberScreen: React.FC = () => {
  const [phone, setPhone] = useState<string>('');
  const [showOtp, setShowOtp] = useState<boolean>(false);

  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState<string>('91');
  const [country, setCountry] = useState<Country | null>(null);

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country);
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
        onPress={() => setShowOtp(true)}
        className="border border-white py-3 rounded-md"
      >
        <Text className="text-white text-center tracking-widest">CREATE ACCOUNT</Text>
      </TouchableOpacity>

      <Text className="text-gray-500 text-xs text-center mt-6">
        By creating an account, you are agreeing to our{' '}
        <Text className="underline">Terms & Conditions</Text> and{' '}
        <Text className="underline">Privacy Policy!</Text>
      </Text>

      <OtpModal visible={showOtp} onClose={() => setShowOtp(false)} />
    </View>
    </TouchableWithoutFeedback>
  );
};

export default PhoneNumberScreen;

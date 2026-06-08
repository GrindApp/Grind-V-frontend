import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useOnboarding } from '@/context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const LocationScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const insets = useSafeAreaInsets();

  const requestLocation = async () => {
  setLoading(true);
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    setLoading(false);
    Alert.alert('Permission Denied', 'Location permission is required to continue.');
    return;
  }

  try {
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // ✅ Save to onboarding context
    updateOnboardingData({
      location: {
        lat: latitude,
        lng: longitude,
      },
    });
    console.log("Current context data", onboardingData);

    setLoading(false);
    router.push('/final-welcome');
  } catch (err) {
    setLoading(false);
    Alert.alert('Error', 'Unable to fetch your location.');
  }
};


  const handleSkipForNow = () => {
    Alert.alert(
      "Skip Location Access",
      "Without location, we can't find nearby matches for you. You can enable it later in settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip Anyway", onPress: () => router.push('/final-welcome') }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
            className="bg-primary">
      <StatusBar barStyle="light-content" />
      
      <View className="flex-1 px-6 py-6">
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleBack}
          className="w-10 h-10 rounded-full mb-6 flex items-center justify-center"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        <View className="flex-1 justify-center items-center">
          {/* Location Icon with Circle Background */}
          <View className="w-32 h-32 rounded-full bg-gray-800 items-center justify-center mb-8">
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              easing="ease-out"
              duration={1500}
              className="w-16 h-16 rounded-full bg-white/10 items-center justify-center"
            >
              <Feather name="map-pin" size={32} color="white" />
            </Animatable.View>
           </View>
          
          {/* Header Text */}
          <Text className="text-white text-3xl font-bold mb-4 text-center">
            Enable location
          </Text>
          
          {/* Description Text */}
          <View className="mb-12 px-4">
            <Text className="text-gray-300 text-center text-base leading-6">
              GRIND uses your location to find nearby gym partners and training buddies in your area.
            </Text>
          </View>
          
          {/* Permissions Benefits List */}
          <View className="w-full mb-12 px-2">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-3">
                <Ionicons name="people" size={18} color="white" />
              </View>
              <Text className="text-gray-200 flex-1">Find workout partners near you</Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-3">
                <Ionicons name="fitness" size={18} color="white" />
              </View>
              <Text className="text-gray-200 flex-1">Discover popular gyms in your area</Text>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-3">
                <Ionicons name="notifications" size={18} color="white" />
              </View>
              <Text className="text-gray-200 flex-1">Get alerts about nearby fitness events</Text>
            </View>
          </View>
        </View>
        
        {/* Buttons */}
        <View className="mb-4">
          <TouchableOpacity
            className="bg-accent py-4 rounded-xl w-full mb-3"
            onPress={requestLocation}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Allow Location Access
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            className="py-4 w-full"
            onPress={handleSkipForNow}
            activeOpacity={0.6}
          >
            <Text className="text-gray-400 text-center">
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Privacy Note */}
        <Text className="text-gray-500 text-xs text-center mb-2">
          Your location data is only used to find matches and is never shared with third parties.
        </Text>
      </View>
    </View>
  );
};

export default LocationScreen;
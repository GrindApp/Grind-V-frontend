import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useOnboarding } from '@/context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const MAX_PHOTOS = 6;

const PhotosScreen = () => {
  const router = useRouter();
  const [photos, setPhotos] = useState<(string | null)[]>(Array(MAX_PHOTOS).fill(null));
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const insets = useSafeAreaInsets();

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission required', 'Allow access to your photos to continue');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const updatedPhotos = [...photos];
      updatedPhotos[index] = result.assets[0].uri;
      setPhotos(updatedPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = null;
    setPhotos(updatedPhotos);
  };

 const handleNext = () => {
  const hasAtLeastOne = photos.some((p) => p !== null);
  if (hasAtLeastOne) {
updateOnboardingData({ imageUrl: photos.filter((p) => p !== null).slice(0, 5) as string[] });
    console.log("Current context data", onboardingData);
    router.push('/location');
  } else {
    Alert.alert('Upload Required', 'Please upload at least one photo.');
  }
};

  const handleBack = () => {
    router.back();
  };

  const getUploadCount = () => {
    return photos.filter(photo => photo !== null).length;
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
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-white text-3xl font-bold">
            Add your best photos
          </Text>
          <Text className="text-gray-300 mt-2">
            Showcase your personality and style
          </Text>
          
          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row items-center">
              <Text className="text-gray-300 text-sm">
                Uploaded: {getUploadCount()}/{MAX_PHOTOS}
              </Text>
              <View className="flex-row ml-2 items-center bg-white/20 px-3 py-1 rounded-full">
                <Ionicons name="information-circle-outline" size={16} color="#ddd" />
                <Text className="text-gray-300 text-xs ml-1">
                  At least one required
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Photo Grid */}
        <ScrollView className="flex-1">
          <View className="flex-row flex-wrap justify-between mb-6">
            {photos.map((photo, index) => (
              <View 
                key={index}
                className="w-[31%] aspect-[3/4] mb-3 relative"
              >
                <TouchableOpacity
                  onPress={() => pickImage(index)}
                  activeOpacity={0.8}
                  className={`w-full h-full rounded-xl overflow-hidden border ${
                    photo ? 'border-white/30' : 'border-gray-700 bg-gray-800'
                  } items-center justify-center`}
                >
                  {photo ? (
                    <Image 
                      source={{ uri: photo }} 
                      className="w-full h-full" 
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="items-center">
                      <Feather name="plus" size={30} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs mt-2">
                        {index === 0 ? 'Primary photo' : `Photo ${index + 1}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                {photo && (
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/70 w-7 h-7 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                )}
                
                {index === 0 && (
                  <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md">
                    <Text className="text-white text-xs">
                      Profile
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Tips Section */}
        <View className="mb-4 p-4 bg-gray-800/70 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb-outline" size={18} color="#F9D949" />
            <Text className="text-white font-medium ml-2">Photo Tips</Text>
          </View>
          <Text className="text-gray-300 text-xs">
            • Clear face photos increase your matches
            • Mix of close-ups and full body shots work best
            • Show your interests and personality
          </Text>
        </View>

        {/* Next Button */}
        <View className="mt-auto pt-2">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              photos.some((p) => p) ? 'bg-accent' : 'bg-gray-700'
            }`}
            onPress={handleNext}
            disabled={!photos.some((p) => p)}
            activeOpacity={0.8}
          >
            <Text 
              className={`text-center font-bold text-lg ${
                photos.some((p) => p) ? 'text-white' : 'text-gray-400'
              }`}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-center text-gray-400 text-xs mt-3">
                    Don't worry, you can update these preferences in your profile settings later.
                  </Text>
      </View>
      </View>
      
    
  );
};

export default PhotosScreen;
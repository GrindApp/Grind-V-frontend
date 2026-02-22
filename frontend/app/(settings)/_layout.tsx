import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack 
        screenOptions={
          {
            headerShown: false
          }
        }/>
    </GestureHandlerRootView>
  );
}

import { Stack } from "expo-router";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OnboardingProvider } from "../context/OnboardingContext";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider> 
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

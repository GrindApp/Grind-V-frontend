import { Stack } from "expo-router";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OnboardingProvider } from "../context/OnboardingContext";
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();
export default function RootLayout() {
  return (
    
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </OnboardingProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

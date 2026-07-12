import { Stack } from "expo-router";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OnboardingProvider } from "../context/OnboardingContext";
import { UnreadMessagesProvider } from "../context/UnreadMessagesContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Hoisted outside component so the cache is never invalidated by re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <UnreadMessagesProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </UnreadMessagesProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import BottomNav from '../components/bottomNav';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { 
            height: 55, 
            padding: 0,
            margin: 0, 
          },
      }}
      tabBar={() => <BottomNav />}
    />
  );
}

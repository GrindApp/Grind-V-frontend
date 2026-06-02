// import React from 'react';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { Slot } from 'expo-router';

// export default function HomeLayout() {
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Slot />
//     </GestureHandlerRootView>
//   );
// }
import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';

export default function HomeLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}
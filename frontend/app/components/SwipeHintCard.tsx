// components/SwipeHintCard.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
// import Animated, {        // ❌ NOT compatible with Expo Go — requires custom native build
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withSequence,
//   withDelay,
//   runOnJS,
// } from "react-native-reanimated";

const SwipeHintCard = ({
  children,
  onHintShown,
}: {
  children: React.ReactNode;
  onHintShown?: () => void;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Replicate the swipe hint sequence using React Native's built-in Animated API
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(translateX, { toValue: -30, duration: 300, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0,   duration: 300, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(translateX, { toValue: -20, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (onHintShown) onHintShown();
    });

    Animated.sequence([
      Animated.delay(3000),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View className="mb-4">
      <Animated.View style={{ transform: [{ translateX }] }}>
        {children}
      </Animated.View>
      <Animated.View style={{ marginTop: 4, opacity }}>
        <Text className="text-gray-400 text-xs text-center">
          Swipe left to chat or remove
        </Text>
      </Animated.View>
    </View>
  );
};

export default SwipeHintCard;
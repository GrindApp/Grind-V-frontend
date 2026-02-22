// components/SwipeHintCard.tsx
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

const SwipeHintCard = ({
  children,
  onHintShown,
}: {
  children: React.ReactNode;
  onHintShown?: () => void;
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSequence(
      withDelay(800, withTiming(-30, { duration: 300 })),
      withTiming(0, { duration: 300 }),
      withDelay(200, withTiming(-20, { duration: 200 })),
      withTiming(0, { duration: 200 }, () => {
        if (onHintShown) runOnJS(onHintShown)();
      })
    );
    opacity.value = withDelay(3000, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="mb-4">
      <Animated.View style={animatedStyle}>{children}</Animated.View>
      <Animated.View style={[{ marginTop: 4 }, hintStyle]}>
        <Text className="text-gray-400 text-xs text-center">
          Swipe left to chat or remove
        </Text>
      </Animated.View>
    </View>
  );
};

export default SwipeHintCard;

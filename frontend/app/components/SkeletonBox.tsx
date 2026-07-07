import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  height: number;
  borderRadius?: number;
  width?: number | string;
  style?: object;
};

export const SkeletonBox = ({ height, borderRadius = 8, width, style }: Props) => {
  const shimmerX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 500,
        duration: 1100,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const containerStyle: any[] = [
    { backgroundColor: "#1C1C1E", borderRadius, overflow: "hidden", height },
    width !== undefined ? { width } : { flex: 1 },
    style,
  ];

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimmerX }] }]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: 200, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

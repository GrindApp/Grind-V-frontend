import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const result = await response.json();

      if (result.success) {
        await AsyncStorage.setItem("authToken", result.data.token);
        const onboarded = result.data.user?.onboarded;
        if (onboarded) {
          router.push("/(tabs)/(home)/HomeScreen");
        } else {
          router.push("/(onboarding)/house_rules");
        }
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require("../../assets/images/grindlogin.webp")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={StyleSheet.absoluteFillObject} className="bg-black/60" />
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 justify-center">

        {/* Brand */}
        <View className="mb-10">
          <Text className="text-accent text-5xl font-extrabold tracking-widest">
            GRIND
          </Text>
          <Text className="text-white text-2xl font-bold mt-1">
            Welcome back
          </Text>
          <Text className="text-secondary text-sm mt-2">
            Sign in to continue your journey
          </Text>
        </View>

        {/* Email */}
        <View className="bg-[#1C1C1E] flex-row items-center rounded-xl px-4 py-4 mb-3">
          <Feather name="mail" size={18} color="#6B7280" />
          <TextInput
            placeholder="Email address"
            placeholderTextColor="#6B7280"
            className="ml-3 text-white flex-1"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View className="bg-[#1C1C1E] flex-row items-center rounded-xl px-4 py-4 mb-2">
          <Feather name="lock" size={18} color="#6B7280" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry={!showPassword}
            className="ml-3 text-white flex-1"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <Link href="/components/ForgotPassword" asChild>
          <TouchableOpacity className="self-end mb-6">
            <Text className="text-accent text-sm">Forgot password?</Text>
          </TouchableOpacity>
        </Link>

        {/* Login Button */}
        <TouchableOpacity
          className="bg-accent py-4 rounded-xl mb-4"
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text className="text-white text-center font-bold text-base tracking-wide">
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Text className="text-secondary text-center mb-7">
          Don't have an account?{" "}
          <Link href="/(auth)/signup">
            <Text className="text-accent font-semibold">Sign up</Text>
          </Link>
        </Text>

        {/* Divider */}
        <View className="flex-row items-center mb-5">
          <View className="h-px flex-1 bg-[#2C2C2E]" />
          <Text className="text-secondary px-3 text-xs tracking-widest">
            OR CONTINUE WITH
          </Text>
          <View className="h-px flex-1 bg-[#2C2C2E]" />
        </View>

        {/* Social Login */}
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1C1C1E] py-3.5 rounded-xl">
            <FontAwesome name="google" size={18} color="white" />
            <Text className="text-white ml-2 font-medium">Google</Text>
          </TouchableOpacity>

          <Link href="/phone_login" asChild>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1C1C1E] py-3.5 rounded-xl">
              <Feather name="phone" size={18} color="white" />
              <Text className="text-white ml-2 font-medium">Phone</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Terms */}
        <Text className="text-secondary text-xs text-center mt-8">
          By signing in, you agree to our{" "}
          <Text
            className="text-white underline"
            onPress={() => router.push("/(settings)/TermsNcondtions")}
          >
            Terms & Conditions
          </Text>{" "}
          and{" "}
          <Text
            className="text-white underline"
            onPress={() => router.push("/(settings)/PrivacyAndTerms")}
          >
            Privacy Policy
          </Text>
        </Text>
        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
});

export default Login;

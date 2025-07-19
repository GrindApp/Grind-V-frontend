import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    try {
      const response = await fetch("http://172.20.10.4:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();
      
      console.log(result);

      if (result.success) {
        await AsyncStorage.setItem("authToken", result.data.token);
        Alert.alert("Success", "Logged in successfully");
        router.push("/");
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-primary px-6 justify-center">
        {/* Header */}
        <Text className="text-white text-5xl font-extrabold">Welcome</Text>
        <Text className="text-white text-5xl font-extrabold">to GRIND</Text>

        {/* Banner */}
        <Image
          source={{ uri: "https://your-banner-image-url.com/image.png" }}
          className="w-full h-32 my-4 rounded-lg"
          resizeMode="cover"
        />

        <Text className="text-gray-400 mb-6">
          Please fill the below details to get started
        </Text>

        {/* Email */}
        <Text className="text-gray-400 mb-1">EMAIL</Text>
       <View className="flex-row items-center border-b border-gray-700 mb-4 pb-2">
          <Feather name="mail" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#6B7280"
            className="ml-2 text-white flex-1"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <Text className="text-gray-400 mb-1">PASSWORD</Text>

       <View className="flex-row items-center border-b border-gray-700 mb-2 pb-2">
          <Feather name="lock" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#6B7280"
            secureTextEntry={!showPassword}
            className="ml-2 text-white flex-1"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-400 mb-6">
          Have you forgotten your password?{" "}
          <Link href="/components/ForgotPassword">
            <Text className="text-red-500">Click here</Text>
          </Link>
        </Text>

        {/* Login Button */}
        <TouchableOpacity
          className="border border-white py-3 rounded-md mb-4"
          onPress={handleLogin}
        >
          <Text className="text-white text-center tracking-widest">Log In</Text>
        </TouchableOpacity>

        <Text className="text-white text-center mb-4">
          Don’t have an account?{""}{" "}
          <Link href="/(auth)/signup">
            <Text className="text-red-500">Sign up</Text>
          </Link>
        </Text>

        {/* Divider */}
        <View className="flex-row items-center justify-center mb-4">
          <View className="h-px flex-1 bg-gray-700" />
          <Text className="text-gray-500 px-2">or</Text>
          <View className="h-px flex-1 bg-gray-700" />
        </View>

        {/* Social Login */}
        <TouchableOpacity className="flex-row items-center justify-center bg-[#1F1F1F] py-3 rounded-md mb-3">
          <FontAwesome name="google" size={18} color="white" />
          <Text className="text-white ml-2">Login with Google</Text>
        </TouchableOpacity>

        <Link href="/phone_login" asChild>
          <TouchableOpacity className="flex-row items-center justify-center border border-gray-700 py-3 rounded-md">
            <Feather name="phone" size={18} color="white" />
            <Text className="text-white ml-2">Login with phone</Text>
          </TouchableOpacity>
        </Link>

        {/* Terms */}
        <Text className="text-gray-500 text-xs text-center mt-6">
          By creating an account, you are agreeing to our{" "}
          <Text className="underline">Terms & Conditions</Text> and{" "}
          <Text className="underline">Privacy Policy!</Text>
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Login;

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUp = () => {
  const [backendErrors, setBackendErrors] = useState<
    Partial<FormData> & { general?: string }
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setBackendErrors({});

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username.toLowerCase(),
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!resData.success) {
        if (resData.message.includes("Email")) {
          setBackendErrors({ email: resData.message });
        } else if (resData.message.includes("Username")) {
          setBackendErrors({ username: resData.message });
        } else {
          setBackendErrors({ general: resData.message });
        }
      } else {
        Alert.alert(
          "Success",
          "Account created successfully!",
          [{ text: "OK", onPress: () => router.push("/login") }],
          { cancelable: false }
        );
      }
    } catch (err) {
      console.error("Error:", err);
      setBackendErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-primary"
      >
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="self-start p-2 bg-[#1C1C1E] rounded-full mb-8"
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>

          {/* Brand */}
          <View className="mb-8">
            <Text className="text-accent text-4xl font-extrabold tracking-widest">
              GRIND
            </Text>
            <Text className="text-white text-2xl font-bold mt-1">
              Create account
            </Text>
            <Text className="text-secondary text-sm mt-2">
              Join the community and start grinding
            </Text>
          </View>

          {/* General Error */}
          {backendErrors.general && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-400 text-sm">
                {backendErrors.general}
              </Text>
            </View>
          )}

          {/* Username */}
          <Controller
            control={control}
            name="username"
            rules={{ required: "Username is required" }}
            render={({ field: { onChange, value } }) => (
              <View className="bg-[#1C1C1E] flex-row items-center rounded-xl px-4 py-4 mb-1">
                <Feather name="user" size={18} color="#6B7280" />
                <TextInput
                  className="ml-3 text-white flex-1"
                  placeholder="Username"
                  placeholderTextColor="#6B7280"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.username || backendErrors.username ? (
            <Text className="text-red-400 text-xs mb-3 ml-1">
              {errors.username?.message || backendErrors.username}
            </Text>
          ) : (
            <View className="mb-3" />
          )}

          {/* Email */}
          <Controller
            control={control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field: { onChange, value } }) => (
              <View className="bg-[#1C1C1E] flex-row items-center rounded-xl px-4 py-4 mb-1">
                <Feather name="mail" size={18} color="#6B7280" />
                <TextInput
                  className="ml-3 text-white flex-1"
                  placeholder="Email address"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                />
              </View>
            )}
          />
          {errors.email || backendErrors.email ? (
            <Text className="text-red-400 text-xs mb-3 ml-1">
              {errors.email?.message || backendErrors.email}
            </Text>
          ) : (
            <View className="mb-3" />
          )}

          {/* Password */}
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: { value: 6, message: "Minimum 6 characters" },
            }}
            render={({ field: { onChange, value } }) => (
              <View className="bg-[#1C1C1E] flex-row items-center rounded-xl px-4 py-4 mb-1">
                <Feather name="lock" size={18} color="#6B7280" />
                <TextInput
                  className="ml-3 text-white flex-1"
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password || backendErrors.password ? (
            <Text className="text-red-400 text-xs mb-3 ml-1">
              {errors.password?.message || backendErrors.password}
            </Text>
          ) : (
            <View className="mb-3" />
          )}

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: "Please confirm your password",
              validate: (val) =>
                val === watch("password") || "Passwords do not match",
            }}
            render={({ field: { onChange, value } }) => (
              <View className="bg-[#1C1C1E] flex-row items-center rounded-xl px-4 py-4 mb-1">
                <Feather name="lock" size={18} color="#6B7280" />
                <TextInput
                  className="ml-3 text-white flex-1"
                  placeholder="Confirm password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={!showConfirmPassword}
                  value={value}
                  onChangeText={onChange}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((p) => !p)}
                >
                  <Feather
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.confirmPassword || backendErrors.confirmPassword ? (
            <Text className="text-red-400 text-xs mb-3 ml-1">
              {errors.confirmPassword?.message || backendErrors.confirmPassword}
            </Text>
          ) : (
            <View className="mb-3" />
          )}

          {/* Submit */}
          <Pressable
            className="bg-accent rounded-xl py-4 mt-2"
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text className="text-white text-center text-base font-bold tracking-wide">
              {loading ? "Creating account..." : "Create Account"}
            </Text>
          </Pressable>

          {/* Log In Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-secondary">Already have an account? </Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text className="text-accent font-semibold">Sign in</Text>
            </Pressable>
          </View>

          {/* Terms */}
          <Text className="text-secondary text-xs text-center mt-6">
            By creating an account, you agree to our{" "}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;

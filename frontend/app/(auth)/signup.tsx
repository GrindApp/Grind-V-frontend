import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
const API_URL = process.env.EXPO_PUBLIC_API_URL;


type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUp = () => {
  const [backendErrors, setBackendErrors] = React.useState<
    Partial<FormData> & { general?: string }
  >({});

  const router = useRouter();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setBackendErrors({}); // Clear old errors

    if (data.password !== data.confirmPassword) {
      setBackendErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username.toLowerCase(),
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await res.json();
      console.log(resData);

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
          [
            {
              text: "OK",
              onPress: () => router.push("/login"),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (err) {
      console.error("Error:", err);
      setBackendErrors({ general: "Something went wrong. Please try again." });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-center px-6 bg-black"
    >
      <Text className="text-3xl font-bold text-white text-center mb-8">
        Sign Up
      </Text>

      {/* Username Field */}
      <Text className="text-white mb-1">Username</Text>
      <Controller
        control={control}
        name="username"
        rules={{ required: "Username is required" }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="bg-white rounded-lg px-4 py-3 mb-4"
            placeholder="Enter your username"
            placeholderTextColor="#888"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.username && (
        <Text className="text-red-500 mb-1">{errors.username.message}</Text>
      )}
      {backendErrors.username && (
        <Text className="text-red-500 mb-2">{backendErrors.username}</Text>
      )}

      {/* Email Field */}
      <Text className="text-white mb-1">Email</Text>
      <Controller
        control={control}
        name="email"
        rules={{ required: "Email is required" }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="bg-white rounded-lg px-4 py-3 mb-4"
            placeholder="Enter your email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.email && (
        <Text className="text-red-500 mb-1">{errors.email.message}</Text>
      )}
      {backendErrors.email && (
        <Text className="text-red-500 mb-2">{backendErrors.email}</Text>
      )}

      {/* Password Field */}
      <Text className="text-white mb-1">Password</Text>
      <Controller
        control={control}
        name="password"
        rules={{
          required: "Password is required",
          minLength: { value: 6, message: "Minimum 6 characters" },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="bg-white rounded-lg px-4 py-3 mb-4"
            placeholder="Enter your password"
            placeholderTextColor="#888"
            secureTextEntry
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.password && (
        <Text className="text-red-500 mb-1">{errors.password.message}</Text>
      )}
      {backendErrors.password && (
        <Text className="text-red-500 mb-2">{backendErrors.password}</Text>
      )}

      {/* Confirm Password Field */}
      <Text className="text-white mb-1">Confirm Password</Text>
      <Controller
        control={control}
        name="confirmPassword"
        rules={{
          required: "Please confirm your password",
          validate: (val) =>
            val === watch("password") || "Passwords do not match",
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="bg-white rounded-lg px-4 py-3 mb-4"
            placeholder="Confirm your password"
            placeholderTextColor="#888"
            secureTextEntry
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.confirmPassword && (
        <Text className="text-red-500 mb-1">
          {errors.confirmPassword.message}
        </Text>
      )}
      {backendErrors.confirmPassword && (
        <Text className="text-red-500 mb-2">
          {backendErrors.confirmPassword}
        </Text>
      )}

      {/* Submit Button */}
      <Pressable
        className="bg-red-500 rounded-lg py-3 mt-4"
        onPress={handleSubmit(onSubmit)}
      >
        <Text className="text-white text-center text-lg font-semibold">
          Sign Up
        </Text>
      </Pressable>

      {/* Link to Login */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-white">Already have an account? </Text>
        <Pressable onPress={() => router.push("/login")}>
          <Text className="text-red-500 underline">Log in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

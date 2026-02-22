import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

const NotificationPreferences = () => {
  const router = useRouter();

  // Example toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-zinc-800/80 rounded-full mr-4"
          >
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Notifications</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-gray-400 text-xs mb-2">PREFERENCES</Text>

          {/* Notification Options */}
          {[
            { label: "Push Notifications", value: pushEnabled, setter: setPushEnabled },
            { label: "Email Notifications", value: emailEnabled, setter: setEmailEnabled },
            { label: "Workout Reminders", value: remindersEnabled, setter: setRemindersEnabled },
            { label: "Product Updates", value: updatesEnabled, setter: setUpdatesEnabled },
          ].map((item, index) => (
            <View
              key={index}
              className="flex-row justify-between items-center py-4 border-b border-zinc-800"
            >
              <Text className="text-white">{item.label}</Text>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                thumbColor={item.value ? "#EF4444" : "#6B7280"}
                trackColor={{ true: "#ffffff", false: "#374151" }}
              />
            </View>
          ))}

          <View className="h-12" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default NotificationPreferences;

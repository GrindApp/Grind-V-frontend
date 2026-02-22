import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  label: string;
  onPress?: () => void;
};

const SettingRow = ({ label, onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row justify-between items-center px-4 py-4 border-b border-gray-700"
    >
      <Text className="text-white text-base">{label}</Text>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

export default SettingRow;

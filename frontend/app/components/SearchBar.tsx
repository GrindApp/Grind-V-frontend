import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Search, X } from 'lucide-react-native';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onClear: () => void;
  placeholder: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
};

const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder,
  onSubmit,
  autoFocus = false
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#262629',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: isFocused ? '#3b82f6' : 'transparent'
    }}>
      <Search
        color={isFocused ? "#3b82f6" : "#6b7280"}
        size={18}
        strokeWidth={2.5}
      />
      
      <TextInput
        style={{
          flex: 1,
          marginLeft: 8,
          color: 'white',
          fontSize: 16,
          height: 24,
          padding: 0
        }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        selectionColor="#3b82f6"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <View style={{ padding: 4 }}>
            <X size={16} color="#6b7280" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
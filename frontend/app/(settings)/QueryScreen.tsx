import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";

const QueryScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [query, setQuery] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const navigation = useNavigation();

  // Form validation
  const isEmailValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !email || emailRegex.test(email);
  };

  const isFormValid = name && email && isEmailValid() && subject && query;

  const handleSubmit = () => {
    if (isFormValid) {
      // Handle submission logic
      console.log('Form submitted:', { name, email, subject, query });
      // Show success feedback
      alert('Your query has been submitted successfully!');
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setQuery('');
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    fieldKey: string,
    options: {
      multiline?: boolean,
      keyboardType?: 'default' | 'email-address',
      icon?: string,
      error?: string
    } = {}
  ) => {
    const isActive = activeField === fieldKey;
    const { multiline, keyboardType, icon, error } = options;
    
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500', marginBottom: 8, marginLeft: 6 }}>{label}</Text>
        <View 
          style={{
            backgroundColor: '#1F1F1F',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isActive ? '#F43F5E' : error ? '#F43F5E' : '#3D3D3D',
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
            {icon && (
              <Ionicons name={icon as any} size={20} color={isActive ? "#F43F5E" : "#A3A3A3"} style={{ marginRight: 12 }} />
            )}
            <TextInput
              placeholder={placeholder}
              placeholderTextColor="#B2B2B2"
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setActiveField(fieldKey)}
              onBlur={() => setActiveField(null)}
              multiline={multiline}
              numberOfLines={multiline ? 6 : 1}
              textAlignVertical={multiline ? "top" : "center"}
              keyboardType={keyboardType || 'default'}
              style={{
                flex: 1,
                color: '#ffffff',
                fontSize: 16,
                paddingVertical: multiline ? 12 : 8,
                paddingHorizontal: 0,
                minHeight: multiline ? 120 : 48,
              }}
            />
          </View>
        </View>
        {error && <Text style={{ color: '#F43F5E', fontSize: 12, marginTop: 4, marginLeft: 8 }}>{error}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18181B' }}>
      
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#18181B", "#09090B"]}
        style={{ position: 'absolute', inset: 0 }}
      />
      
      {/* Header */}
       <View className="flex-row items-center mb-6 space-x-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2 bg-zinc-800/80 rounded-full ml-3"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-2xl font-bold"> Support</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        >
          {/* Support message */}
          <View style={{ backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#3D3D3D' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialIcons name="support-agent" size={20} color="#F43F5E" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>We're Here To Help</Text>
            </View>
            <Text style={{ color: '#B2B2B2', fontSize: 14 }}>
              Complete the form below and our support team will get back to you within 24-48 hours.
            </Text>
          </View>

          {/* Form fields */}
          <View>
            {renderInputField(
              'Full Name',
              name,
              setName,
              'Enter your name',
              'name',
              { icon: 'person-outline' }
            )}

            {renderInputField(
              'Email Address',
              email,
              setEmail,
              'Enter your email',
              'email',
              { 
                icon: 'mail-outline',
                keyboardType: 'email-address',
                error: email && !isEmailValid() ? 'Please enter a valid email address' : undefined
              }
            )}

            {renderInputField(
              'Subject',
              subject,
              setSubject,
              'What is your query about?',
              'subject',
              { icon: 'help-circle-outline' }
            )}

            {renderInputField(
              'Your Message',
              query,
              setQuery,
              'Provide details about your question or issue...',
              'query',
              { multiline: true, icon: 'chatbox-outline' }
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: isFormValid ? '#EF4444' : '#3D3D3D',
              alignItems: 'center',
              shadowColor: isFormValid ? "#accent" : "#000",
              shadowOpacity: isFormValid ? 0.3 : 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>SUBMIT QUERY</Text>
          </TouchableOpacity>
          
          {/* Alternative contact method */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: '#A3A3A3', fontSize: 14 }}>Or contact us directly at</Text>
            <TouchableOpacity>
              <Text style={{ color: '#F43F5E', fontWeight: '600', fontSize: 14 }}>support@fitnessapp.com</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default QueryScreen;

import ProfileAvatar from "@/components/Profile/ProfileAvatar";
import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Profile update validation schema
const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const user = authState?.userDetails;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const onSaveProfile = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Your profile has been updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 120, // Extra space for tab bar
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</Text>
            <Text className="text-gray-600 text-base">Update your personal information</Text>
          </View>

          {/* Profile Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <ProfileAvatar
              name={user?.fullName}
              role={user?.role}
              editable={true}
              onPressEdit={() => Alert.alert("Change Photo", "This functionality will be available soon.")}
            />

            <View className="space-y-6 mt-6">
              {/* Full Name Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Full Name
                </Text>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${
                        errors.fullName
                          ? "border-red-500 bg-red-50"
                          : focusedField === "fullName"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      style={{
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your full name"
                      onFocus={() => setFocusedField("fullName")}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      autoComplete="name"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Full name input"
                      accessibilityHint="Enter your complete name"
                    />
                  )}
                />
                {errors.fullName && (
                  <Text className="text-red-600 text-sm ml-1 mt-2 font-medium">
                    {errors.fullName.message}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Email Address
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${
                        errors.email
                          ? "border-red-500 bg-red-50"
                          : focusedField === "email"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      style={{
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your email address"
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Email address input"
                      accessibilityHint="Enter your email address"
                    />
                  )}
                />
                {errors.email && (
                  <Text className="text-red-600 text-sm ml-1 mt-2 font-medium">
                    {errors.email.message}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Phone Number
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${
                        errors.phone
                          ? "border-red-500 bg-red-50"
                          : focusedField === "phone"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      style={{
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your phone number"
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Phone number input"
                      accessibilityHint="Enter your phone number"
                    />
                  )}
                />
                {errors.phone && (
                  <Text className="text-red-600 text-sm ml-1 mt-2 font-medium">
                    {errors.phone.message}
                  </Text>
                )}
              </View>

              {/* Buttons */}
              <View className="flex-row space-x-4 mt-8">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="flex-1 border border-gray-300 rounded-xl py-4 px-4 items-center bg-gray-50"
                  style={{
                    minHeight: 56,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
                  accessibilityHint="Discard changes and go back"
                >
                  <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit(onSaveProfile)}
                  disabled={loading}
                  className={`flex-1 rounded-xl py-4 items-center ${
                    loading ? "bg-blue-400" : "bg-blue-600"
                  }`}
                  style={{
                    minHeight: 56,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile changes"
                  accessibilityHint="Save the updated profile information"
                  accessibilityState={{ disabled: loading }}
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white font-semibold text-base">Saving...</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

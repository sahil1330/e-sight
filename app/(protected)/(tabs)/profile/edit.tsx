import ProfileAvatar from "@/components/Profile/ProfileAvatar";
import ProfileSection from "@/components/Profile/ProfileSection";
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

      // Here you would update the profile via API
      console.log("Profile update data:", data);

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
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" contentContainerClassName="py-4">
          <ProfileSection title="Edit Profile Information">
            <ProfileAvatar
              name={user?.fullName}
              role={user?.role}
              editable={true}
              onPressEdit={() => Alert.alert("Change Photo", "This functionality will be available soon.")}
            />

            <View className="space-y-4 mt-6">
              {/* Full Name Field */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Full Name
                </Text>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3 ${
                        errors.fullName
                          ? "border-red-500 bg-red-50"
                          : focusedField === "fullName"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                      onFocus={() => setFocusedField("fullName")}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.fullName && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    {errors.fullName.message}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Email Address
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3 ${
                        errors.email
                          ? "border-red-500 bg-red-50"
                          : focusedField === "email"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your email"
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    {errors.email.message}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Phone Number
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3 ${
                        errors.phone
                          ? "border-red-500 bg-red-50"
                          : focusedField === "phone"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your phone number"
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="phone-pad"
                    />
                  )}
                />
                {errors.phone && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    {errors.phone.message}
                  </Text>
                )}
              </View>

              {/* Buttons */}
              <View className="flex-row space-x-3 mt-2">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="flex-1 border border-gray-300 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-gray-600 font-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSubmit(onSaveProfile)}
                  disabled={loading}
                  className={`flex-1 rounded-xl py-3.5 items-center ${
                    loading ? "bg-blue-400" : "bg-blue-500"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ProfileSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

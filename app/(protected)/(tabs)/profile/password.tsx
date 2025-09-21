import axiosInstance from "@/utils/axiosInstance";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Password change validation schema
const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Add responsive design support
  const fontSize = 16;

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => setError(null) },
      ]);
    }
    // Reset the error state when the component mounts or error changes
    return () => {
      setError(null);
    };
  }, [error]);

  const onChangePassword = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/users/change-password", {
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (response.status !== 200) {
        setError(response.data.error);
        throw new Error("Failed to change password");
      }
      Alert.alert("Success", "Your password has been changed successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
      reset();
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Handle generic error
        setError(error.message);
      }
      if (isAxiosError(error)) {
        // Handle Axios error
        const errorMessage = await getErrorMessage(error.response?.data || "");
        setError(errorMessage);
        console.error("Error changing password:", errorMessage);
      }
      console.error(
        "Error changing password:",
        error instanceof Error ? error.message : String(error)
      );
      Alert.alert("Error", "Failed to change password. Please try again.");
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
            minHeight: '100%',
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="items-center mb-10">
            <View className="w-40 h-40 rounded-full items-center justify-center mb-6">
              {/* <Text className="text-white text-2xl font-bold">E</Text> */}
              <Image
                source={require('../../../../assets/images/icon.png')}
                style={{ resizeMode: 'contain' }}
                accessible
                accessibilityLabel="App logo"
                className="w-32 h-32 rounded-full"
              />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Change Password
            </Text>
            <Text className="text-gray-600 text-center text-lg">
              Update your password to keep your account secure
            </Text>
          </View>

          {/* Form Container */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="space-y-6">
              {/* Current Password Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Current Password
                </Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="currentPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border-2 rounded-xl px-4 py-4 pr-16 text-black ${errors.currentPassword
                          ? "border-red-500 bg-red-50"
                          : focusedField === "currentPassword"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                          }`}
                        style={{
                          fontSize,
                          minHeight: 56,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        placeholder="Enter current password"
                        onFocus={() => setFocusedField("currentPassword")}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showCurrentPassword}
                        autoComplete="current-password"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="Current password input"
                        accessibilityHint="Enter your current account password"
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-4 p-2"
                    style={{ minHeight: 44, minWidth: 44 }}
                    accessibilityRole="button"
                    accessibilityLabel={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    <Text className="text-blue-600 font-medium">
                      {showCurrentPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.currentPassword.message}
                  </Text>
                )}
              </View>

              {/* New Password Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  New Password
                </Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="newPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border-2 rounded-xl px-4 py-4 pr-16 text-black ${errors.newPassword
                          ? "border-red-500 bg-red-50"
                          : focusedField === "newPassword"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                          }`}
                        style={{
                          fontSize,
                          minHeight: 56,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        placeholder="Enter new password"
                        onFocus={() => setFocusedField("newPassword")}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showNewPassword}
                        autoComplete="new-password"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="New password input"
                        accessibilityHint="Enter your new account password"
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-4 p-2"
                    style={{ minHeight: 44, minWidth: 44 }}
                    accessibilityRole="button"
                    accessibilityLabel={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    <Text className="text-blue-600 font-medium">
                      {showNewPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.newPassword.message}
                  </Text>
                )}
              </View>

              {/* Confirm Password Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Confirm New Password
                </Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border-2 rounded-xl px-4 py-4 pr-16 text-black ${errors.confirmPassword
                          ? "border-red-500 bg-red-50"
                          : focusedField === "confirmPassword"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                          }`}
                        style={{
                          fontSize,
                          minHeight: 56,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        placeholder="Confirm new password"
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="new-password"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="Confirm new password input"
                        accessibilityHint="Re-enter your new password to confirm"
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4 p-2"
                    style={{ minHeight: 44, minWidth: 44 }}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    <Text className="text-blue-600 font-medium">
                      {showConfirmPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              {/* Buttons */}
              <View className="flex-row space-x-3 gap-2 mt-4">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="flex-1 border-2 border-gray-300 rounded-2xl py-4 items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel password change"
                >
                  <Text className="text-gray-600 font-bold text-base">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit(onChangePassword)}
                  disabled={loading}
                  className={`flex-1 rounded-xl py-4 items-center ${loading ? "bg-blue-400" : "bg-blue-600"
                    }`}
                  style={{
                    minHeight: 56,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Update your password"
                  accessibilityState={{ disabled: loading }}
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white font-bold text-base">Updating...</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-bold text-base">Update Password</Text>
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

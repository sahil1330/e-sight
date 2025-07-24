import ProfileSection from "@/components/Profile/ProfileSection";
import axiosInstance from "@/utils/axiosInstance";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
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
      console.log("Password change response:", response.data);
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" contentContainerClassName="py-4">
          <ProfileSection title="Change Your Password">
            <Text className="text-gray-600 mb-4">
              Update your password to keep your account secure. Choose a strong
              password that you don&apos;t use elsewhere.
            </Text>

            <View className="space-y-4">
              {/* Current Password Field */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Current Password
                </Text>
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        className={`border rounded-xl px-4 py-3 ${
                          errors.currentPassword
                            ? "border-red-500 bg-red-50"
                            : focusedField === "currentPassword"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter current password"
                        onFocus={() => setFocusedField("currentPassword")}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showCurrentPassword}
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        <Ionicons
                          name={
                            showCurrentPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.currentPassword && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    {errors.currentPassword.message}
                  </Text>
                )}
              </View>

              {/* New Password Field */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  New Password
                </Text>
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        className={`border rounded-xl px-4 py-3 ${
                          errors.newPassword
                            ? "border-red-500 bg-red-50"
                            : focusedField === "newPassword"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter new password"
                        onFocus={() => setFocusedField("newPassword")}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons
                          name={
                            showNewPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.newPassword && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    {errors.newPassword.message}
                  </Text>
                )}
              </View>

              {/* Confirm Password Field */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Confirm New Password
                </Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        className={`border rounded-xl px-4 py-3 ${
                          errors.confirmPassword
                            ? "border-red-500 bg-red-50"
                            : focusedField === "confirmPassword"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Confirm new password"
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-xs ml-1 mt-1">
                    {errors.confirmPassword.message}
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
                  onPress={handleSubmit(onChangePassword)}
                  disabled={loading}
                  className={`flex-1 rounded-xl py-3.5 items-center ${
                    loading ? "bg-blue-400" : "bg-blue-500"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold">
                      Update Password
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

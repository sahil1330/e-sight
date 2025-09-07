import AuthButton from '@/components/ui/AuthButton';
import AuthHeader from '@/components/ui/AuthHeader';
import CodeInput from '@/components/ui/CodeInput';
import { verifyCodeSchema, VerifyCodeFormData } from '@/schema/forgotPasswordSchema';
import axiosInstance from '@/utils/axiosInstance';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VerifyResetCodeScreen = () => {
    const params = useLocalSearchParams();
    const email = params.email as string;
    const router = useRouter();
    const { width } = useWindowDimensions();
    
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);

    const isSmallDevice = width < 380;
    const headerFontSize = isSmallDevice ? 24 : 28;

    const {
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<VerifyCodeFormData>({
        resolver: zodResolver(verifyCodeSchema),
        defaultValues: {
            code: "",
        },
    });

    const verifyResetCode = async (userEmail: string, code: string) => {
        try {
            const response = await axiosInstance.post('/users/verify-forget-password-code', {
                email: userEmail,
                code: code,
            });

            if (response.status === 200) {
                return { success: true, message: response.data.message || 'Code verified successfully' };
            } else {
                return { success: false, message: response.data.message || 'Invalid verification code' };
            }
        } catch (error) {
            console.error('Verify reset code error:', error);
            if (isAxiosError(error)) {
                const errorMessage = await getErrorMessage(error.response?.data || '');
                return { success: false, message: errorMessage };
            }
            return { success: false, message: 'An unexpected error occurred' };
        }
    };

    const sendResetCode = async (userEmail: string) => {
        try {
            const response = await axiosInstance.post('/users/send-forget-password-code', {
                email: userEmail,
            });

            if (response.status === 200) {
                return { success: true, message: response.data.message || 'Reset code sent successfully' };
            } else {
                return { success: false, message: response.data.message || 'Failed to send reset code' };
            }
        } catch (error) {
            console.error('Send reset code error:', error);
            if (isAxiosError(error)) {
                const errorMessage = await getErrorMessage(error.response?.data || '');
                return { success: false, message: errorMessage };
            }
            return { success: false, message: 'An unexpected error occurred' };
        }
    };

    const handleCodeChange = (text: string, index: number) => {
        if (text.length > 1) {
            // Handle paste of the entire code
            const pastedCode = text.slice(0, 6);
            const newDigits = [...codeDigits];

            for (let i = 0; i < pastedCode.length; i++) {
                if (i + index < 6) {
                    newDigits[i + index] = pastedCode[i];
                }
            }

            setCodeDigits(newDigits);
            setValue("code", newDigits.join(""));
        } else {
            // Handle single digit input
            const newDigits = [...codeDigits];
            newDigits[index] = text;
            setCodeDigits(newDigits);
            setValue("code", newDigits.join(""));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace
        if (
            e.nativeEvent.key === "Backspace" &&
            index > 0 &&
            codeDigits[index] === ""
        ) {
            const newDigits = [...codeDigits];
            newDigits[index - 1] = "";
            setCodeDigits(newDigits);
            setValue("code", newDigits.join(""));
        }
    };

    const onSubmit = async (data: VerifyCodeFormData) => {
        setIsLoading(true);
        try {
            const result = await verifyResetCode(email, data.code);
            
            if (result.success) {
                Alert.alert(
                    "Code Verified",
                    "Verification successful! You can now reset your password.",
                    [
                        {
                            text: "Continue",
                            onPress: () => router.push({
                                pathname: "/reset-password" as any,
                                params: { email }
                            })
                        }
                    ]
                );
            } else {
                Alert.alert("Verification Failed", result.message);
            }
        } catch (error) {
            console.error('Verify reset code error:', error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        try {
            const result = await sendResetCode(email);
            if (result.success) {
                Alert.alert("Code Resent", "A new verification code has been sent to your email.");
                // Clear current code
                setCodeDigits(["", "", "", "", "", ""]);
                setValue("code", "");
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error: any) {
            console.error('Resend code error:', error);
            Alert.alert("Error", "Failed to resend code. Please try again.");
        } finally {
            setIsLoading(false);
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
                        paddingTop: 40,
                        paddingBottom: 40,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <AuthHeader
                        title="Enter Reset Code"
                        subtitle={`We've sent a 6-digit verification code to your email.`}
                        iconName="shield-checkmark-outline"
                        iconColor="#6366F1"
                        iconBgColor="bg-indigo-100 border-indigo-200"
                        headerFontSize={headerFontSize}
                    />

                    {/* Email Display */}
                    <View className="items-center mb-8">
                        <View className="bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-200">
                            <Text className="text-indigo-700 text-center text-lg font-semibold">
                                {email}
                            </Text>
                        </View>
                    </View>

                    {/* Form Container */}
                    <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                        <CodeInput
                            codeDigits={codeDigits}
                            onCodeChange={handleCodeChange}
                            onKeyPress={handleKeyPress}
                            onFocus={(index) => setFocusedIndex(index)}
                            onBlur={() => setFocusedIndex(null)}
                            error={errors.code?.message}
                            focusedIndex={focusedIndex || undefined}
                            editable={!isLoading}
                        />

                        <AuthButton
                            title="Verify Code"
                            onPress={handleSubmit(onSubmit)}
                            isLoading={isLoading}
                            loadingText="Verifying..."
                            variant="primary"
                        />

                        {/* Resend Code */}
                        <View className="items-center mt-6">
                            <Text className="text-gray-600 mb-3 text-base">
                                Didn&apos;t receive the code?
                            </Text>
                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={isLoading}
                                style={{ minHeight: 44 }}
                                className="py-2"
                                accessibilityRole="button"
                                accessibilityLabel="Resend verification code"
                                accessibilityHint="Request a new verification code to be sent to your email"
                            >
                                <Text className={`font-semibold text-base ${isLoading ? 'text-gray-400' : 'text-blue-600'}`}>
                                    {isLoading ? 'Sending...' : 'Resend Code'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center mt-8">
                        <TouchableOpacity
                            onPress={() => router.push("/forgot-password" as any)}
                            className="flex-row items-center py-2"
                            style={{ minHeight: 44 }}
                            accessibilityRole="button"
                            accessibilityLabel="Go back to forgot password"
                        >
                            <Text className="text-blue-600 font-semibold text-base">
                                ← Back to Email Entry
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default VerifyResetCodeScreen;

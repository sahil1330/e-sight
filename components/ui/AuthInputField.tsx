import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AuthInputFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    onFocus?: () => void;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: 'email' | 'password' | 'new-password' | 'current-password' | 'off';
    editable?: boolean;
    showPasswordToggle?: boolean;
    onTogglePassword?: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    isFocused?: boolean;
    fontSize?: number;
}

const AuthInputField: React.FC<AuthInputFieldProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    onBlur,
    onFocus,
    error,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete,
    editable = true,
    showPasswordToggle = false,
    onTogglePassword,
    accessibilityLabel,
    accessibilityHint,
    isFocused = false,
    fontSize = 16
}) => {
    return (
        <View className="mb-6">
            <Text className="text-base font-semibold text-gray-800 mb-3">
                {label}
            </Text>
            <View className="relative">
                <TextInput
                    className={`border-2 rounded-xl px-4 py-4 text-black ${
                        error
                            ? "border-red-500 bg-red-50"
                            : isFocused
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-white"
                    } ${showPasswordToggle ? 'pr-16' : ''}`}
                    style={{
                        fontSize,
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                    }}
                    placeholder={placeholder}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    onChangeText={onChangeText}
                    value={value}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    placeholderTextColor="#9CA3AF"
                    accessibilityLabel={accessibilityLabel}
                    accessibilityHint={accessibilityHint}
                    editable={editable}
                />
                {showPasswordToggle && onTogglePassword && (
                    <TouchableOpacity
                        onPress={onTogglePassword}
                        className="absolute right-3 top-3"
                        style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
                        accessibilityRole="button"
                        accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
                    >
                        <Ionicons
                            name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#6b7280"
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {error}
                </Text>
            )}
        </View>
    );
};

export default AuthInputField;

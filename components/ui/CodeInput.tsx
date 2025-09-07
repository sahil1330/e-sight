import React, { useRef } from 'react';
import { Text, TextInput, View } from 'react-native';

interface CodeInputProps {
    codeDigits: string[];
    onCodeChange: (text: string, index: number) => void;
    onKeyPress: (e: any, index: number) => void;
    onFocus: (index: number) => void;
    onBlur: () => void;
    error?: string;
    focusedIndex?: number;
    editable?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({
    codeDigits,
    onCodeChange,
    onKeyPress,
    onFocus,
    onBlur,
    error,
    focusedIndex,
    editable = true
}) => {
    const codeInputRefs = useRef<(TextInput | null)[]>([]);

    return (
        <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
                Enter Verification Code
            </Text>

            <View className="flex-row justify-between">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            codeInputRefs.current[index] = ref;
                        }}
                        className={`w-14 h-16 border-2 text-center rounded-xl text-xl font-bold ${
                            error && codeDigits.join("").length < 6
                                ? "border-red-500 bg-red-50"
                                : focusedIndex === index
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white"
                        }`}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                        }}
                        maxLength={index === 0 ? 6 : 1}
                        keyboardType="number-pad"
                        value={codeDigits[index]}
                        onChangeText={(text) => onCodeChange(text, index)}
                        onKeyPress={(e) => onKeyPress(e, index)}
                        onFocus={() => onFocus(index)}
                        onBlur={onBlur}
                        accessibilityLabel={`Verification code digit ${index + 1}`}
                        accessibilityHint={`Enter the ${index + 1} digit of your verification code`}
                        editable={editable}
                    />
                ))}
            </View>

            {error && (
                <Text className="text-red-600 text-sm mt-3 ml-1 text-center font-medium">
                    {error}
                </Text>
            )}
        </View>
    );
};

export default CodeInput;

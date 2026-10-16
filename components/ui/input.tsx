import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, containerClassName, className, ...props },
  ref,
) {
  return (
    <View className={cn("gap-2", containerClassName)}>
      {label ? (
        <Text className="text-sm text-left font-bold text-foreground">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        textAlignVertical="center"
        placeholderTextColor="#9CA3AF"
        className={cn(
          "h-14 rounded-xl border border-input bg-card px-4 py-0 text-base leading-5 text-foreground",
          className as string,
        )}
        {...props}
      />
    </View>
  );
});

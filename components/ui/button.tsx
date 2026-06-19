import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  leftIcon?: ReactNode;
}

const container: Record<Variant, string> = {
  primary: "bg-primary active:opacity-90",
  outline: "bg-card border border-border active:bg-secondary",
};

const text: Record<Variant, string> = {
  primary: "text-primary-foreground",
  outline: "text-foreground",
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  leftIcon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        "h-14 flex-row items-center justify-center gap-3 rounded-xl px-4",
        container[variant],
        isDisabled && "opacity-50",
        className as string,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#111"} />
      ) : (
        <>
          {leftIcon}
          <Text className={cn("text-base font-semibold", text[variant])}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

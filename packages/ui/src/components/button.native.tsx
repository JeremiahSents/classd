import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type PressableStateCallbackType,
} from "react-native";

import { colors, radius, spacing } from "@workspace/ui/tokens";

type ButtonProps = PressableProps & {
  children: string;
  variant?: "default" | "secondary" | "outline";
};

export function Button({ children, style, variant = "default", ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        typeof style === "function"
          ? style({ pressed } as PressableStateCallbackType)
          : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, variant === "default" ? styles.defaultLabel : styles.subtleLabel]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
  },
  default: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  defaultLabel: {
    color: colors.primaryForeground,
  },
  subtleLabel: {
    color: colors.secondaryForeground,
  },
});

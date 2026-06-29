import {
  Add01Icon,
  DashboardCircleAddIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const glassAvailable = isLiquidGlassAvailable();

interface MenuItem {
  label: string;
  Icon: IconSvgElement;
  onPress?: () => void;
}

export function HomeHeader({
  firstName,
  avatarUrl,
  onAvatarPress,
  onCreateClass,
  onJoinClass,
}: {
  firstName: string;
  avatarUrl?: string;
  onAvatarPress?: () => void;
  onCreateClass?: () => void;
  onJoinClass?: () => void;
}) {
  const initial = firstName.charAt(0).toUpperCase() || "?";
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);

  const items: MenuItem[] = [
    { label: "Create class", Icon: DashboardCircleAddIcon, onPress: onCreateClass },
    { label: "Join class", Icon: UserGroupIcon, onPress: onJoinClass },
  ];

  function select(item: MenuItem) {
    setMenuOpen(false);
    item.onPress?.();
  }

  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={onAvatarPress}
        className="flex-1 flex-row items-center gap-3 active:opacity-80"
      >
        <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text className="text-lg font-black text-muted-foreground">
              {initial}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text
            className="text-xl font-black tracking-tight text-foreground"
            numberOfLines={1}
          >
            Hi {firstName}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            Here&apos;s what&apos;s happening today.
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add"
        onPress={() => setMenuOpen(true)}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
      >
        <HugeiconsIcon icon={Add01Icon} size={24} color="#fff" />
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setMenuOpen(false)}>
          <View
            style={{
              position: "absolute",
              top: insets.top + 72,
              right: 24,
              width: 224,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            {glassAvailable ? (
              <GlassView
                style={StyleSheet.absoluteFill}
                glassEffectStyle="regular"
                tintColor={
                  isDark ? "rgba(40,40,40,0.5)" : "rgba(255,255,255,0.6)"
                }
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? "rgba(30,30,30,0.92)"
                      : "rgba(255,255,255,0.96)",
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              />
            )}
            {items.map((item, index) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => select(item)}
                className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary/40 ${
                  index > 0 ? "border-t border-border/40" : ""
                }`}
              >
                <HugeiconsIcon icon={item.Icon} size={20} color="#4f46e5" />
                <Text className="text-base font-medium text-popover-foreground">
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

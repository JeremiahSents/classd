import { useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import {
  Home01Icon,
  Mortarboard02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

/* ------------------------------------------------------------------ */
/*  Icon map                                                          */
/* ------------------------------------------------------------------ */
const ICONS: Record<string, IconSvgElement> = {
  index: Home01Icon,
  classes: Mortarboard02Icon,
  profile: UserIcon,
};

/* ------------------------------------------------------------------ */
/*  Theme                                                             */
/* ------------------------------------------------------------------ */
const LIGHT = {
  icon: "#3b82f6",
  iconInactive: "#94a3b8",
  glassTint: "rgba(220, 225, 235, 0.55)",
  fallbackBg: "rgba(230, 233, 240, 0.78)",
  fallbackBorder: "rgba(0,0,0,0.06)",
  activePill: "rgba(255, 255, 255, 0.9)",
};

const DARK = {
  icon: "#ffffff",
  iconInactive: "#888888",
  glassTint: "rgba(40, 40, 40, 0.5)",
  fallbackBg: "rgba(30,30,30,0.78)",
  fallbackBorder: "rgba(255,255,255,0.08)",
  activePill: "rgba(255, 255, 255, 0.15)",
};

const SPRING = { damping: 15, stiffness: 400, mass: 0.3 };
const glass = isLiquidGlassAvailable();

/* ------------------------------------------------------------------ */
/*  Tab bar                                                           */
/* ------------------------------------------------------------------ */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? DARK : LIGHT;

  // Only show routes that have an explicit icon — hides detail screens like class/[id]
  const visibleRoutes = state.routes.filter((route) => route.name in ICONS);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.pill}>
        {/* Background layer */}
        {glass ? (
          <GlassView
            style={[styles.fill, { backgroundColor: theme.glassTint }]}
            glassEffectStyle="regular"
            isInteractive
          />
        ) : (
          <View
            style={[
              styles.fill,
              {
                backgroundColor: theme.fallbackBg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.fallbackBorder,
              },
            ]}
          />
        )}

        {/* Tabs */}
        {visibleRoutes.map((route) => {
          const icon = ICONS[route.name] ?? Home01Icon;
          const focused = state.routes[state.index].key === route.key;

          return (
            <TabItem
              key={route.key}
              icon={icon}
              focused={focused}
              iconColor={focused ? theme.icon : theme.iconInactive}
              activePillColor={theme.activePill}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual tab                                                    */
/* ------------------------------------------------------------------ */
interface TabItemProps {
  icon: IconSvgElement;
  focused: boolean;
  iconColor: string;
  activePillColor: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  icon,
  focused,
  iconColor,
  activePillColor,
  onPress,
}: TabItemProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.82, SPRING);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tab, animStyle]}
    >
      {/* White capsule pill behind the active icon */}
      {focused && (
        <View
          style={[styles.activePill, { backgroundColor: activePillColor }]}
        />
      )}
      <HugeiconsIcon
        icon={icon}
        size={24}
        color={iconColor}
        strokeWidth={focused ? 2.4 : 1.6}
      />
    </AnimatedPressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  tab: {
    width: 64,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: "absolute",
    width: 48,
    height: 36,
    borderRadius: 999,
  },
});

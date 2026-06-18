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
  active: "#4f46e5",
  inactive: "#9ca3af",
  fallbackBg: "rgba(255,255,255,0.82)",
  fallbackBorder: "rgba(0,0,0,0.06)",
};

const DARK = {
  active: "#6366f1",
  inactive: "#52525b",
  fallbackBg: "rgba(30,30,30,0.78)",
  fallbackBorder: "rgba(255,255,255,0.08)",
};

const SPRING = { damping: 15, stiffness: 400, mass: 0.3 };
const glass = isLiquidGlassAvailable();

/* ------------------------------------------------------------------ */
/*  Tab bar                                                           */
/* ------------------------------------------------------------------ */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? DARK : LIGHT;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.pill}>
        {/* Background layer */}
        {glass ? (
          <GlassView style={styles.fill} glassEffectStyle="regular" isInteractive />
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
        {state.routes.map((route, index) => {
          const icon = ICONS[route.name] ?? Home01Icon;
          const focused = state.index === index;

          return (
            <TabItem
              key={route.key}
              icon={icon}
              focused={focused}
              activeColor={theme.active}
              inactiveColor={theme.inactive}
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
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  icon,
  focused,
  activeColor,
  inactiveColor,
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
      <HugeiconsIcon
        icon={icon}
        size={24}
        color={focused ? activeColor : inactiveColor}
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
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
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
});

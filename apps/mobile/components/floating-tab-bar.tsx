import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { GraduationCap, House, User, type LucideIcon } from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTabBarCollapsed } from "@/lib/tab-bar-scroll";

const ICONS: Record<string, LucideIcon> = {
  index: House,
  classes: GraduationCap,
  profile: User,
};

const ACTIVE = "#4f46e5"; // primary
const INACTIVE = "#9ca3af";
const H_PADDING = 8;
const TAB_WIDTH = 76; // fixed per-tab width so the pill never squeezes

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const collapsed = useTabBarCollapsed();
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * TAB_WIDTH, {
      damping: 16,
      stiffness: 180,
      mass: 0.7,
    });
  }, [state.index, indicatorX]);

  // Shrink / tuck away on scroll.
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: collapsed.value * 110 },
      { scale: 1 - collapsed.value * 0.12 },
    ],
    opacity: 1 - collapsed.value * 0.25,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const glass = isLiquidGlassAvailable();

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: "absolute", left: 0, right: 0, bottom: insets.bottom + 12 },
        containerStyle,
      ]}
      className="items-center"
    >
      <View
        className="flex-row overflow-hidden rounded-full"
        style={{
          paddingHorizontal: H_PADDING,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        {/* Background: liquid glass on iOS 26, frosted fallback elsewhere. */}
        {glass ? (
          <GlassView
            style={StyleFill}
            glassEffectStyle="regular"
            isInteractive
          />
        ) : (
          <View
            style={StyleFill}
            className="rounded-full border border-white/20 bg-white/80"
          />
        )}

        {/* Fluid active-tab indicator */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 8,
              bottom: 8,
              left: H_PADDING,
              width: TAB_WIDTH,
              borderRadius: 999,
            },
            indicatorStyle,
          ]}
          className="bg-primary/10"
        />

        {state.routes.map((route, index) => {
          const Icon = ICONS[route.name] ?? House;
          const focused = state.index === index;

          return (
            <TabItem
              key={route.key}
              Icon={Icon}
              focused={focused}
              width={TAB_WIDTH}
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
    </Animated.View>
  );
}

const StyleFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 999,
};

interface TabItemProps {
  Icon: LucideIcon;
  focused: boolean;
  width?: number;
  onPress: () => void;
}

function TabItem({ Icon, focused, width, onPress }: TabItemProps) {
  const shake = useSharedValue(0);
  const scale = useSharedValue(1);

  function handlePress() {
    // Quick wobble + bump on tap.
    shake.value = withSequence(
      withTiming(-1, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(-0.6, { duration: 50 }),
      withSpring(0, { damping: 6, stiffness: 220 }),
    );
    scale.value = withSequence(
      withTiming(1.25, { duration: 90 }),
      withSpring(1, { damping: 9, stiffness: 240 }),
    );
    onPress();
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 4 },
      { rotateZ: `${shake.value * 8}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={{ width }}
      className="h-14 items-center justify-center"
    >
      <Animated.View style={iconStyle}>
        <Icon size={24} color={focused ? ACTIVE : INACTIVE} strokeWidth={focused ? 2.4 : 2} />
      </Animated.View>
    </Pressable>
  );
}

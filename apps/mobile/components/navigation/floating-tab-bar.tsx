import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import {
  Home01Icon,
  Mortarboard02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const ICONS: Record<string, IconSvgElement> = {
  index: Home01Icon,
  classes: Mortarboard02Icon,
  profile: UserIcon,
};

const ACTIVE = "#4f46e5"; // primary
const INACTIVE = "#9ca3af";
const H_PADDING = 8;
const TAB_WIDTH = 76; // fixed per-tab width so the pill never squeezes

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const glass = isLiquidGlassAvailable();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 12 }}
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
          <GlassView style={StyleFill} glassEffectStyle="regular" isInteractive />
        ) : (
          <View
            style={StyleFill}
            className="rounded-full border border-white/20 bg-white/80"
          />
        )}

        {state.routes.map((route, index) => {
          const icon = ICONS[route.name] ?? Home01Icon;
          const focused = state.index === index;

          return (
            <TabItem
              key={route.key}
              icon={icon}
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
    </View>
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
  icon: IconSvgElement;
  focused: boolean;
  width?: number;
  onPress: () => void;
}

function TabItem({ icon, focused, width, onPress }: TabItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ width }}
      className="h-14 items-center justify-center"
    >
      {/* Static highlight behind the active tab. */}
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          focused ? "bg-primary/10" : ""
        }`}
      >
        <HugeiconsIcon
          icon={icon}
          size={24}
          color={focused ? ACTIVE : INACTIVE}
          strokeWidth={focused ? 2.2 : 1.8}
        />
      </View>
    </Pressable>
  );
}

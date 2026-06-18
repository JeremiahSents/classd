import { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SegmentedTabsProps {
  tabs: string[];
  active: number;
  onChange: (index: number) => void;
}

/** A segmented control with a fluid sliding indicator. */
export function SegmentedTabs({ tabs, active, onChange }: SegmentedTabsProps) {
  const [width, setWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const segWidth = width > 0 ? width / tabs.length : 0;

  useEffect(() => {
    indicatorX.value = withSpring(active * segWidth, {
      damping: 16,
      stiffness: 180,
      mass: 0.7,
    });
  }, [active, segWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      className="flex-row rounded-full bg-secondary p-1"
    >
      {segWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              width: segWidth - 8,
              borderRadius: 999,
            },
            indicatorStyle,
          ]}
          className="bg-background shadow-sm"
        />
      ) : null}

      {tabs.map((tab, index) => {
        const focused = index === active;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            onPress={() => onChange(index)}
            style={{ width: segWidth || undefined }}
            className="items-center justify-center py-2"
          >
            <Text
              className={
                focused
                  ? "text-sm font-semibold text-foreground"
                  : "text-sm font-medium text-muted-foreground"
              }
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

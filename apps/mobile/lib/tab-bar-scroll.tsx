import { createContext, useContext, type ReactNode } from "react";
import {
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

interface TabBarScrollStore {
  /** 0 = fully expanded/visible, 1 = shrunk/tucked away. */
  collapsed: SharedValue<number>;
}

const TabBarScrollContext = createContext<TabBarScrollStore | null>(null);

export function TabBarScrollProvider({ children }: { children: ReactNode }) {
  const collapsed = useSharedValue(0);
  return (
    <TabBarScrollContext.Provider value={{ collapsed }}>
      {children}
    </TabBarScrollContext.Provider>
  );
}

export function useTabBarCollapsed(): SharedValue<number> {
  const ctx = useContext(TabBarScrollContext);
  if (!ctx) {
    throw new Error("useTabBarCollapsed must be used within a TabBarScrollProvider");
  }
  return ctx.collapsed;
}

/**
 * Returns an animated scroll handler to spread onto an Animated.ScrollView.
 * Scrolling down tucks the floating tab bar away; scrolling back up brings
 * it back, with a fluid spring.
 */
export function useTabBarScrollHandler() {
  const collapsed = useTabBarCollapsed();
  const lastY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const dy = y - lastY.value;
      lastY.value = y;

      // Ignore tiny jitters and bounce past the top.
      if (y <= 0) {
        collapsed.value = withSpring(0, { damping: 18, stiffness: 160 });
        return;
      }
      if (Math.abs(dy) < 4) return;

      const target = dy > 0 ? 1 : 0;
      collapsed.value = withSpring(target, { damping: 18, stiffness: 160 });
    },
  });
}

import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/navigation/floating-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="classes" options={{ title: "Classes" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      {/* Detail screens inside tabs to keep the tab bar visible */}
      <Tabs.Screen name="class/[id]" options={{ href: null }} />
    </Tabs>
  );
}

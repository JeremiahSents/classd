import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/floating-tab-bar";
import { ClassesProvider } from "@/lib/classes-store";
import { TabBarScrollProvider } from "@/lib/tab-bar-scroll";

export default function TabsLayout() {
  return (
    <ClassesProvider>
      <TabBarScrollProvider>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <FloatingTabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="classes" options={{ title: "Classes" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
      </TabBarScrollProvider>
    </ClassesProvider>
  );
}

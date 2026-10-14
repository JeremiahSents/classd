// In-app privacy policy, reachable signed out (login screen) and signed in
// (Settings). It describes what the app actually stores — keep it in sync with
// the data model in ARCHITECTURE.md. The store listings also need this text at
// a public URL.
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

const LAST_UPDATED = "October 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we collect",
    body: [
      "Account details: your name, email address and chosen avatar.",
      "Class activity: the classes and project groups you join, tasks you mark complete, and anything class reps post (tasks, announcements and uploaded materials).",
      "A push-notification token for your device, so we can send you reminders.",
      "Your notification preferences.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "To run the app: show your classes, tasks and announcements, and let class reps manage their class.",
      "To send push notifications about new posts and upcoming or overdue work. You can turn these off in Settings.",
      "We don't sell your data or use it for advertising.",
    ],
  },
  {
    title: "Who can see it",
    body: [
      "Members of a class can see each other's names and email addresses, and everything posted in that class.",
      "Administrators can see all classes and their members, to manage them.",
      "Data is stored with Google Firebase. Push notifications are delivered through Expo and Google/Apple push services.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Edit your name and avatar from your profile.",
      "Turn notifications on or off in Settings.",
      "Delete your account at any time from Settings → Delete account. This removes your profile, your task progress and your class and group memberships. Content you posted as a class rep stays with the class.",
    ],
  },
];

export default function Privacy() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 pb-1 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#111" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">Privacy policy</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-16 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xs text-muted-foreground">Last updated {LAST_UPDATED}</Text>
        {SECTIONS.map((section) => (
          <View key={section.title} className="gap-2">
            <Text className="text-base font-bold text-foreground">{section.title}</Text>
            {section.body.map((line) => (
              <Text key={line} className="text-sm leading-6 text-muted-foreground">
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

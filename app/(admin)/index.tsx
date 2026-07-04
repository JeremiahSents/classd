import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Class } from "@/lib/api";
import { useSession } from "@/lib/session";

interface Row {
  cls: Class;
  memberCount: number;
}

export default function AdminHome() {
  const router = useRouter();
  const { signOut } = useSession();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const classes = await api.listClasses();
      const withCounts = await Promise.all(
        classes.map(async (c) => ({
          cls: c,
          memberCount: (await api.listMembers(c.id)).length,
        })),
      );
      setRows(withCounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.createClass({ name: newName.trim() });
      setNewName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create class.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      router.replace("/(auth)/login");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-6 pb-4 pt-6">
        <View>
          <Text className="text-sm font-medium text-muted-foreground">Admin</Text>
          <Text className="text-2xl font-bold text-foreground">Classes</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={handleSignOut}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary"
        >
          <HugeiconsIcon icon={Logout01Icon} size={22} color="#ef4444" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Create a class */}
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-base font-semibold text-foreground">Create a class</Text>
          <Input
            placeholder="e.g. Intro to Biology"
            value={newName}
            onChangeText={setNewName}
            autoCapitalize="words"
          />
          <Button
            label="Create class"
            loading={creating}
            disabled={!newName.trim()}
            onPress={handleCreate}
          />
        </View>

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        {/* All classes */}
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : rows.length === 0 ? (
          <Text className="text-center text-muted-foreground">
            No classes yet. Create one above.
          </Text>
        ) : (
          rows.map(({ cls, memberCount }) => (
            <Pressable
              key={cls.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: "/(admin)/class/[id]", params: { id: cls.id } })
              }
              className="gap-1.5 rounded-2xl border border-border bg-card p-4 active:bg-secondary"
            >
              <Text className="text-base font-semibold text-foreground">{cls.name}</Text>
              <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
                <Text className="font-mono text-xs text-muted-foreground">
                  ID {cls.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text className="text-xs text-muted-foreground">Code {cls.code}</Text>
                <Text className="text-xs text-muted-foreground">
                  {memberCount} member{memberCount === 1 ? "" : "s"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

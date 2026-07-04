import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useSession } from "@/lib/session";

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail } = useSession();

  const [mode, setMode] = useState(0); // 0 = Login, 1 = Register
  const isRegister = mode === 1;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const profile = isRegister
        ? // Everyone registers as a student; a class rep is assigned later.
          await signUpWithEmail({
            name: name.trim() || undefined,
            email: email.trim(),
            password,
            role: "student",
          })
        : await signInWithEmail({ email: email.trim(), password });

      // route by system role: admins get the admin panel
      if (profile.role === "admin") {
        router.replace("/(admin)" as never);
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-md self-center">
            {/* Header */}
            <View className="gap-6 pb-8">
              <Logo size={96} style={{ alignSelf: "center" }} />
              <Text className="text-2xl font-bold text-foreground text-center">
                {isRegister ? "Create your account" : "Welcome back"}
              </Text>
            </View>

            {/* Login / Register switch */}
            <View className="pb-6">
              <SegmentedTabs
                tabs={["Login", "Register"]}
                active={mode}
                onChange={(i) => {
                  setMode(i);
                  setError(null);
                }}
              />
            </View>

            {/* Form */}
            <View className="gap-4">
              {isRegister ? (
                <Input
                  label="Full name"
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              ) : null}

              <Input
                label="University email"
                placeholder="you@strathmore.edu"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                inputMode="email"
              />

              <Input
                label="Password"
                placeholder={isRegister ? "Create a password" : "Your password"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={isRegister ? "password-new" : "password"}
              />

              {error ? (
                <Text className="text-center text-sm font-medium text-red-500">
                  {error}
                </Text>
              ) : null}

              <Button
                label={isRegister ? "Create account" : "Log in"}
                onPress={handleSubmit}
                loading={submitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

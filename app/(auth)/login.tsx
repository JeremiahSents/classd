import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import {
    googleAuthConfig,
    googleIdTokenFromResult,
    isGoogleAuthConfigured,
} from "@/lib/google-auth";
import { useSession } from "@/lib/session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleConfigured = isGoogleAuthConfigured();
  const [googleRequest, , promptGoogleAsync] = Google.useIdTokenAuthRequest(
    googleAuthConfig(),
    { scheme: "classd" },
  );

  async function handleLogin() {
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail({ email: email.trim(), password });
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleContinue() {
    setError(null);
    if (!googleConfigured) {
      setError("Google sign-in needs Google OAuth client IDs in .env first.");
      return;
    }
    if (!googleRequest) {
      setError("Google sign-in is still loading. Please try again.");
      return;
    }

    setGoogleSubmitting(true);
    try {
      const result = await promptGoogleAsync();
      const idToken = googleIdTokenFromResult(result);
      await signInWithGoogle(idToken, "student");
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setGoogleSubmitting(false);
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
            <View className="gap-6 pb-8">
              <Logo size={96} style={{ alignSelf: "center" }} />
              <View className="gap-1.5">
                <Text className="text-2xl font-bold text-foreground text-center">
                  Welcome back
                </Text>
                <Text className="text-center text-sm text-muted-foreground">
                  Log in to your account
                </Text>
              </View>
            </View>

            <View className="gap-4">
              <Input
                label="University email"
                placeholder="you@university.edu"
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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />

              <Button label="Log in" onPress={handleLogin} loading={submitting} />
            </View>

            {error ? (
              <Text className="pt-3 text-center text-sm font-medium text-red-500">
                {error}
              </Text>
            ) : null}

            <View className="gap-4 pt-4">
              <View className="flex-row items-center gap-4 py-2">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-sm text-muted-foreground">Or continue with</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <Button
                label="Continue with Google"
                variant="outline"
                leftIcon={<GoogleIcon size={20} />}
                loading={googleSubmitting}
                disabled={!googleRequest || googleSubmitting}
                onPress={handleGoogleContinue}
              />
            </View>

            <View className="flex-row items-center justify-center gap-1 pt-6">
              <Text className="text-sm text-muted-foreground">
                Don&apos;t have an account?
              </Text>
              <Pressable onPress={() => router.replace("/register")}>
                <Text className="text-sm font-semibold text-primary">Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

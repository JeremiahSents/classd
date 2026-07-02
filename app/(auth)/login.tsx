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
import { GoogleIcon } from "@/components/ui/google-icon";
import { AppleIcon } from "@/components/ui/apple-icon";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useSession } from "@/lib/session";

// Google sign-in only works once client IDs are set (see .env). When they're
// missing we render a disabled fallback instead of the real button, because
// Google.useAuthRequest throws at render time with no client id.
const GOOGLE_CONFIGURED = !!(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
);

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useSession();

  const [mode, setMode] = useState(0); // 0 = Login, 1 = Register
  const isRegister = mode === 1;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completeSocial(run: () => Promise<void>) {
    setError(null);
    setSubmitting(true);
    try {
      await run();
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        // Everyone registers as a student; a class rep is assigned later.
        await signUpWithEmail({
          name: name.trim() || undefined,
          email: email.trim(),
          password,
          role: "student",
        });
      } else {
        await signInWithEmail({ email: email.trim(), password });
      }
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApple() {
    if (Platform.OS !== "ios") {
      setError("Apple sign-in is only available on iOS.");
      return;
    }
    try {
      const AppleAuthentication = await import("expo-apple-authentication");
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const token = credential.identityToken;
        await completeSocial(() => signInWithApple(token));
      }
    } catch (e) {
      if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      setError("Apple sign-in failed.");
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

            {/* Social auth */}
            <View className="gap-4 pt-6">
              <View className="flex-row items-center gap-4 py-2">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-sm text-muted-foreground">Or continue with</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              {GOOGLE_CONFIGURED ? (
                <GoogleAuthButton
                  disabled={submitting}
                  onToken={(idToken) => completeSocial(() => signInWithGoogle(idToken))}
                />
              ) : (
                <Button
                  label="Continue with Google"
                  variant="outline"
                  leftIcon={<GoogleIcon size={20} />}
                  disabled={submitting}
                  onPress={() => setError("Google sign-in isn't configured yet.")}
                />
              )}
              {Platform.OS === "ios" ? (
                <Button
                  label="Continue with Apple"
                  variant="outline"
                  leftIcon={<AppleIcon size={20} />}
                  disabled={submitting}
                  onPress={handleApple}
                />
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

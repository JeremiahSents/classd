import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { useSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
import {
  googleAuthConfig,
  googleIdTokenFromResult,
  isGoogleAuthConfigured,
} from "@/lib/google-auth";

WebBrowser.maybeCompleteAuthSession();

export default function Register() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { signUpWithEmail, signInWithEmail, signInWithGoogle } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepProgress = useSharedValue(0);
  const googleConfigured = isGoogleAuthConfigured();
  const [googleRequest, , promptGoogleAsync] = Google.useIdTokenAuthRequest(
    googleAuthConfig(),
    { scheme: "classd" },
  );

  const emailStepStyle = useAnimatedStyle(() => ({
    opacity: 1 - stepProgress.value,
    transform: [{ translateX: -width * stepProgress.value }],
  }));

  const passwordStepStyle = useAnimatedStyle(() => ({
    opacity: stepProgress.value,
    transform: [{ translateX: width * (1 - stepProgress.value) }],
  }));

  async function submitCredentials() {
    setError(null);
    setSubmitting(true);
    try {
      try {
        await signUpWithEmail({
          email: email.trim(),
          password,
          name: name.trim(),
          role: "student",
        });
      } catch (e) {
        // Returning user: the account already exists, so sign in instead. This
        // lets the single register screen handle both new and existing users.
        if (e instanceof ApiError && e.code === "already-exists") {
          await signInWithEmail({ email: email.trim(), password });
        } else {
          throw e;
        }
      }
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailContinue() {
    if (!showPassword) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your email.");
        return;
      }
      setError(null);
      setShowPassword(true);
      stepProgress.value = withTiming(1, { duration: 260 });
      return;
    }
    submitCredentials();
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
                  Create your Account
                </Text>
              </View>
            </View>

            <View className="relative overflow-hidden" style={{ minHeight: 250 }}>
              <Animated.View className="absolute inset-x-0 top-0 gap-4" style={emailStepStyle}>
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect={false}
                />

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

                <Button label="Continue with email" onPress={handleEmailContinue} />
              </Animated.View>

              <Animated.View
                className="absolute inset-x-0 top-0 gap-4"
                pointerEvents={showPassword ? "auto" : "none"}
                style={passwordStepStyle}
              >
                <Input
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                <Button
                  label="Create account"
                  onPress={handleEmailContinue}
                  loading={submitting}
                />
              </Animated.View>
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

            <Text className="pt-4 text-center text-xs leading-5 text-muted-foreground">
              Class representative access is assigned after signup.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

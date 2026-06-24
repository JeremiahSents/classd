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
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useSession, type Role } from "@/lib/session";
import { AppleIcon } from "@/components/ui/apple-icon";
import { ApiError } from "@/lib/api";

const ROLES: Role[] = ["classRep", "student"];

export default function Register() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { signUpWithEmail, signInWithEmail } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepProgress = useSharedValue(0);

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
    const role = ROLES[roleIndex];
    try {
      try {
        await signUpWithEmail({ email: email.trim(), password, role });
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

  function handleSocialAuth(provider: "google" | "apple") {
    // Google/Apple sign-in needs OAuth client setup (expo-auth-session) to get
    // an idToken before api.signInWithGoogle/Apple can run. Not wired up yet.
    setError(
      `${provider === "google" ? "Google" : "Apple"} sign-in isn't set up yet — please use email.`,
    );
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
              <View className="gap-1.5">
                <Text className="text-2xl font-bold text-foreground text-center">
                  Create your Account
                </Text>
              </View>
            </View>

            {/* Form */}
            <View className="relative overflow-hidden" style={{ minHeight: 250 }}>
              <Animated.View className="absolute inset-x-0 top-0 gap-4" style={emailStepStyle}>
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

                <View className="gap-2">
                  <Text className="text-center text-sm font-medium text-foreground">
                    I am a
                  </Text>
                  <SegmentedTabs
                    tabs={["Class Rep", "Student"]}
                    active={roleIndex}
                    onChange={setRoleIndex}
                  />
                </View>

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

            {/* Social Auth always visible */}
            <View className="gap-4 pt-2">
              <View className="flex-row items-center gap-4 py-2">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-sm text-muted-foreground">
                  Or sign up with
                </Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <Button
                label="Continue with Google"
                variant="outline"
                leftIcon={<GoogleIcon size={20} />}
                onPress={() => handleSocialAuth("google")}
              />
              <Button
                label="Continue with Apple"
                variant="outline"
                leftIcon={<AppleIcon size={20} />}
                onPress={() => handleSocialAuth("apple")}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

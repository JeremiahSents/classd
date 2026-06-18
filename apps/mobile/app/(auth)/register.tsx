import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { useSession, type Role } from "@/lib/session";
import { AppleIcon } from "@/components/ui/apple-icon";

const ROLES: Role[] = ["lecturer", "student"];

export default function Register() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const stepProgress = useSharedValue(0);

  const emailStepStyle = useAnimatedStyle(() => ({
    opacity: 1 - stepProgress.value,
    transform: [{ translateX: -width * stepProgress.value }],
  }));

  const passwordStepStyle = useAnimatedStyle(() => ({
    opacity: stepProgress.value,
    transform: [{ translateX: width * (1 - stepProgress.value) }],
  }));

  function enterApp() {
    signIn(ROLES[roleIndex]);
    router.replace("/(tabs)");
  }

  function handleEmailContinue() {
    if (!showPassword) {
      setShowPassword(true);
      stepProgress.value = withTiming(1, { duration: 260 });
      return;
    }

    // TODO: wire up to auth backend
    console.log("register", { email, password });
    enterApp();
  }

  function handleSocialAuth(provider: "google" | "apple") {
    console.log(`${provider} sign-in`);
    enterApp();
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
            <View className="relative overflow-hidden" style={{ minHeight: 390 }}>
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
                    tabs={["Lecturer", "Student"]}
                    active={roleIndex}
                    onChange={setRoleIndex}
                  />
                </View>

                <Button label="Continue with email" onPress={handleEmailContinue} />

                {/* Separator */}
                <View className="flex-row items-center gap-4 py-4">
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
                <Button label="Create account" onPress={handleEmailContinue} />
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

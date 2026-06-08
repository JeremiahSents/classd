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
import { Link, useRouter } from "expo-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleRegister() {
    // TODO: wire up to auth backend
    console.log("register", { email, password });
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="gap-6 pb-8 pt-6">
            <Logo size={64} style={{ alignSelf: "center" }} />
            <View className="gap-1.5">
              <Text className="text-2xl font-bold text-foreground text-center">
                Create your Account
              </Text>
              <Text className="text-base text-muted-foreground text-center">
                Sign up with your university email to get started.
              </Text>
            </View>
          </View>

          {/* Form */}
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />

            <Button label="Create account" onPress={handleRegister} />

            {/* Separator */}
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
              onPress={() => console.log("google sign-in")}
            />
          </View>

          {/* Footer */}
          <View className="mt-auto flex-row justify-center gap-1 pt-8">
            <Text className="text-base text-muted-foreground">
              Already have an account?
            </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-base font-semibold text-primary">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

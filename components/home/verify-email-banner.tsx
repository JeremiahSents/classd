import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/session";

/**
 * Nudge shown on Home until the user verifies their email. Not blocking —
 * the app works while unverified — but it confirms the address is theirs so
 * password resets reach them.
 */
export function VerifyEmailBanner() {
  const toast = useToast();
  const { email, emailVerified, role, resendVerificationEmail, reloadUser } = useSession();
  const [busy, setBusy] = useState<"resend" | "check" | null>(null);

  // admins are created in the console and never see this
  if (emailVerified || role === "admin") return null;

  async function handleResend() {
    setBusy("resend");
    try {
      await resendVerificationEmail();
      toast.success("Verification email sent", "📬");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the email.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCheck() {
    setBusy("check");
    try {
      await reloadUser();
      // if verified, the banner disappears on the re-render
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not check right now.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View className="gap-3 rounded-2xl border border-amber-300 bg-amber-500/10 p-4">
      <View className="flex-row items-start gap-3">
        <HugeiconsIcon icon={Mail01Icon} size={20} color="#d97706" />
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold text-foreground">Verify your email</Text>
          <Text className="text-xs text-muted-foreground">
            We sent a link to {email}. Tap it, then come back here.
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          disabled={busy !== null}
          onPress={handleCheck}
          className="h-9 flex-1 items-center justify-center rounded-full bg-amber-600 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-white">
            {busy === "check" ? "Checking..." : "I've verified"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy !== null}
          onPress={handleResend}
          className="h-9 flex-1 items-center justify-center rounded-full border border-amber-400 active:bg-amber-500/10"
        >
          <Text className="text-xs font-semibold text-amber-700">
            {busy === "resend" ? "Sending..." : "Resend email"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

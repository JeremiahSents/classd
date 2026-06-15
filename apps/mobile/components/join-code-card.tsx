import { useState } from "react";
import { Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Check, Copy, Share2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface JoinCodeCardProps {
  className: string;
  code: string;
}

/** Displays a class join code with copy + share actions. */
export function JoinCodeCard({ className, code }: JoinCodeCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleShare() {
    await Share.share({
      message: `Join my class "${className}" on classd with code ${code}`,
    });
  }

  return (
    <View className="gap-4">
      <View className="items-center rounded-2xl border border-border bg-card py-6">
        <Text className="text-sm text-muted-foreground">Join code</Text>
        <Text className="text-4xl font-bold tracking-[0.3em] text-foreground">
          {code}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Button
          className="flex-1"
          variant="outline"
          label={copied ? "Copied" : "Copy code"}
          leftIcon={
            copied ? (
              <Check size={20} color="#111" />
            ) : (
              <Copy size={20} color="#111" />
            )
          }
          onPress={handleCopy}
        />
        <Button
          className="flex-1"
          variant="outline"
          label="Share link"
          leftIcon={<Share2 size={20} color="#111" />}
          onPress={handleShare}
        />
      </View>
    </View>
  );
}

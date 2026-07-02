import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/google-icon";

WebBrowser.maybeCompleteAuthSession();

/**
 * Google sign-in button. `Google.useAuthRequest` throws if no client id is set,
 * so this component is only rendered when at least one is configured — the
 * parent shows a disabled fallback otherwise.
 */
export function GoogleAuthButton({
  onToken,
  disabled,
}: {
  onToken: (idToken: string) => void;
  disabled?: boolean;
}) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken =
        response.authentication?.idToken ??
        (response.params?.id_token as string | undefined);
      if (idToken) onToken(idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <Button
      label="Continue with Google"
      variant="outline"
      leftIcon={<GoogleIcon size={20} />}
      disabled={disabled || !request}
      onPress={() => promptAsync()}
    />
  );
}

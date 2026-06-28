import type { AuthSessionResult } from "expo-auth-session";
import type { GoogleAuthRequestConfig } from "expo-auth-session/providers/google";

export function googleAuthConfig(): Partial<GoogleAuthRequestConfig> {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
  };
}

export function isGoogleAuthConfigured(): boolean {
  const config = googleAuthConfig();
  return Boolean(config.webClientId || config.iosClientId || config.androidClientId);
}

export function googleIdTokenFromResult(result: AuthSessionResult): string {
  if (result.type !== "success") {
    throw new Error("Google sign-in was cancelled.");
  }

  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error("Google did not return an ID token.");
  }

  return idToken;
}

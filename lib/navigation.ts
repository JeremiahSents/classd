// Back navigation for screens pushed on the root stack (class, task, group,
// settings, …). Goes to the previous screen; if there isn't one — e.g. the
// screen was opened straight from a notification on a cold start — it falls
// back to Home instead of doing nothing.
import { router } from "expo-router";

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/(tabs)");
}

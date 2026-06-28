import type { Router } from "expo-router";

export function goBackOrHome(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)");
}

export function goBackOrProfile(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)/profile");
}

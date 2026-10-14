// Handles push notifications while the app runs (native only — mounted from
// app/_layout.tsx):
//  - tapping a notification opens the task or class it's about, including
//    when the tap launched the app;
//  - a notification arriving while the app is open refreshes the data, so the
//    new post is already there.
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useClasses } from "@/lib/classes-store";
import { routeForNotification } from "@/lib/push";
import { useSession } from "@/lib/session";

export function NotificationRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, role } = useSession();
  const { loading, refresh } = useClasses();
  const response = Notifications.useLastNotificationResponse();
  // each notification is handled once, even though the hook keeps returning it
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = Notifications.addNotificationReceivedListener(() => {
      void refresh(true);
    });
    return () => sub.remove();
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    // wait until signed in, data loaded, and past the splash (which would
    // otherwise replace the screen we open). Admins have no class screens.
    if (!isAuthenticated || loading || pathname === "/" || role === "admin") return;

    const id = response.notification.request.identifier;
    if (handledId.current === id) return;
    handledId.current = id;

    const route = routeForNotification(response.notification.request.content.data);
    if (!route) return;
    // fetch first so a brand-new task is in the store when its screen opens
    void refresh(true).then(() => router.push(route));
  }, [response, isAuthenticated, loading, pathname, role, refresh, router]);

  return null;
}

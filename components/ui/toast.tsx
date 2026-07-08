// Lightweight, friendly confirmation toasts.
//
// Wrap the app in <ToastProvider> once (see app/_layout.tsx), then call
// useToast().success("Joined the class!") anywhere. A single toast slides down
// from the top with a little spring, shows a fun emoji, and auto-dismisses.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastTone = "success" | "info" | "error";

interface ToastOptions {
  emoji?: string;
  tone?: ToastTone;
  /** ms before auto-dismiss (default 2600). */
  duration?: number;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, emoji?: string) => void;
  error: (message: string, emoji?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// A rotating set of celebratory emojis so repeat successes feel a little alive.
const CELEBRATE = ["🎉", "✅", "🙌", "🚀", "✨", "👏", "🥳"];

const toneStyles: Record<ToastTone, { bg: string; text: string; defaultEmoji: string }> = {
  success: { bg: "#4f46e5", text: "#ffffff", defaultEmoji: "🎉" },
  info: { bg: "#0f172a", text: "#ffffff", defaultEmoji: "💬" },
  error: { bg: "#dc2626", text: "#ffffff", defaultEmoji: "⚠️" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{
    message: string;
    emoji: string;
    tone: ToastTone;
  } | null>(null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      const tone = options?.tone ?? "success";
      const emoji =
        options?.emoji ??
        (tone === "success"
          ? CELEBRATE[Math.floor(Math.random() * CELEBRATE.length)]
          : toneStyles[tone].defaultEmoji);

      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, emoji, tone });

      translateY.setValue(-120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      hideTimer.current = setTimeout(dismiss, options?.duration ?? 2600);
    },
    [dismiss, opacity, translateY],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, emoji) => show(message, { tone: "success", emoji }),
      error: (message, emoji) => show(message, { tone: "error", emoji }),
    }),
    [show],
  );

  const style = toast ? toneStyles[toast.tone] : toneStyles.success;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 0,
            right: 0,
            alignItems: "center",
            transform: [{ translateY }],
            opacity,
          }}
        >
          <Pressable
            onPress={dismiss}
            style={{
              maxWidth: "92%",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: style.bg,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 999,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 18 }}>{toast.emoji}</Text>
            <Text
              numberOfLines={2}
              style={{ color: style.text, fontWeight: "600", fontSize: 14, flexShrink: 1 }}
            >
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

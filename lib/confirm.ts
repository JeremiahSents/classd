// Cross-platform "are you sure?" dialog for destructive actions.
//
//   if (await confirmAction({ title: "Delete file?", confirmLabel: "Delete" })) { ... }
//
// Native uses Alert.alert; web falls back to window.confirm (Alert's buttons
// don't work on react-native-web).
import { Alert, Platform } from "react-native";

interface ConfirmOptions {
  title: string;
  message?: string;
  /** Label for the confirming button (default "Confirm"). */
  confirmLabel?: string;
  /** Style the confirm button as destructive (default true). */
  destructive?: boolean;
}

export function confirmAction({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

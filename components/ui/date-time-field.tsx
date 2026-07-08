import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { cn } from "@/lib/utils";

type DateTimeFieldMode = "date" | "time";

interface DateTimeFieldProps {
  label: string;
  value: string;
  mode: DateTimeFieldMode;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  containerClassName?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateValue(date: Date, mode: DateTimeFieldMode): string {
  if (mode === "date") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseValue(value: string, mode: DateTimeFieldMode): Date {
  const now = new Date();
  if (mode === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (mode === "time" && /^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    const parsed = new Date(now);
    parsed.setHours(hours, minutes, 0, 0);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return now;
}

function displayValue(value: string, mode: DateTimeFieldMode): string {
  if (!value) return "";
  if (mode === "date") {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  if (mode === "time" && /^\d{2}:\d{2}$/.test(value)) {
    const parsed = parseValue(value, "time");
    return parsed.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return value;
}

export function DateTimeField({
  label,
  value,
  mode,
  onChange,
  placeholder,
  minimumDate,
  containerClassName,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseValue(value, mode));

  const pickerValue = useMemo(() => parseValue(value, mode), [mode, value]);
  const shownValue = displayValue(value, mode);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "dismissed" || !selected) return;
    if (Platform.OS === "ios") {
      setDraft(selected);
    } else {
      onChange(formatDateValue(selected, mode));
    }
  }

  function openPicker() {
    setDraft(pickerValue);
    setOpen(true);
  }

  function confirmIos() {
    onChange(formatDateValue(draft, mode));
    setOpen(false);
  }

  return (
    <View className={cn("gap-2", containerClassName)}>
      <Text className="text-left text-sm font-bold text-foreground">{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        className="h-14 justify-center rounded-xl border border-input bg-card px-4"
      >
        <Text className={cn("text-base leading-5", shownValue ? "text-foreground" : "text-gray-400")}>
          {shownValue || placeholder || (mode === "date" ? "Select date" : "Select time")}
        </Text>
      </Pressable>

      {open && Platform.OS !== "ios" ? (
        <DateTimePicker
          value={pickerValue}
          mode={mode}
          display="default"
          minimumDate={mode === "date" ? minimumDate : undefined}
          onChange={handleChange}
        />
      ) : null}

      <Modal visible={open && Platform.OS === "ios"} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-card p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable onPress={() => setOpen(false)} className="px-2 py-2">
                <Text className="text-base font-semibold text-muted-foreground">Cancel</Text>
              </Pressable>
              <Text className="text-base font-bold text-foreground">{label}</Text>
              <Pressable onPress={confirmIos} className="px-2 py-2">
                <Text className="text-base font-semibold text-primary">Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              minimumDate={mode === "date" ? minimumDate : undefined}
              onChange={handleChange}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// A tappable field that opens the platform's native date + time picker —
// the iOS scroll-wheel and the Android calendar/clock dialogs — instead of
// making the user type "YYYY-MM-DD".
//
// Usage:
//   const [due, setDue] = useState<Date | null>(null);
//   <DateTimeField label="Due date *" value={due} onChange={setDue} />
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar03Icon } from "@hugeicons/core-free-icons";

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

interface DateTimeFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
}

export function DateTimeField({
  label,
  value,
  onChange,
  placeholder = "Select date & time",
  minimumDate,
}: DateTimeFieldProps) {
  // iOS shows an inline spinner inside a bottom sheet; Android uses the native
  // dialogs opened imperatively (date first, then time).
  const [iosOpen, setIosOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());

  function openAndroid() {
    const base = value ?? new Date();
    DateTimePickerAndroid.open({
      value: base,
      mode: "date",
      minimumDate,
      onChange: (event, date) => {
        if (event.type !== "set" || !date) return;
        // chain into the time picker once a date is chosen
        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          is24Hour: false,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== "set" || !time) return;
            const combined = new Date(date);
            combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(combined);
          },
        });
      },
    });
  }

  function open() {
    if (Platform.OS === "android") {
      openAndroid();
    } else {
      setTemp(value ?? new Date());
      setIosOpen(true);
    }
  }

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={open}
        className="flex-row items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3.5 active:opacity-70"
      >
        <Text className={`text-base ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value ? formatDateTime(value) : placeholder}
        </Text>
        <HugeiconsIcon icon={Calendar03Icon} size={18} color="#9ca3af" />
      </Pressable>

      {/* iOS: bottom-sheet spinner with Cancel / Done */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIosOpen(false)}
        >
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setIosOpen(false)}>
            <Pressable onPress={() => {}} className="rounded-t-3xl bg-card pb-8">
              <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                <Pressable onPress={() => setIosOpen(false)} hitSlop={8}>
                  <Text className="text-base text-muted-foreground">Cancel</Text>
                </Pressable>
                <Text className="text-base font-semibold text-foreground">
                  {label ?? "Pick date & time"}
                </Text>
                <Pressable
                  onPress={() => {
                    onChange(temp);
                    setIosOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Text className="text-base font-semibold text-primary">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={temp}
                mode="datetime"
                display="spinner"
                minimumDate={minimumDate}
                onChange={(_, d) => {
                  if (d) setTemp(d);
                }}
                style={{ height: 216 }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

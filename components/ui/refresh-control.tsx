import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";

/**
 * Pull-to-refresh for a ScrollView:
 *
 *   const refreshControl = useRefreshControl(() => refresh(true));
 *   <ScrollView refreshControl={refreshControl}>
 *
 * Shows the spinner until `load` settles; errors are left to `load` to report.
 */
export function useRefreshControl(load: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      // the screen's own load handles/reports failures
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#4f46e5"
      colors={["#4f46e5"]}
    />
  );
}

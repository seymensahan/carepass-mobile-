import { useEffect, useState } from "react";
import { offlineManager } from "../services/offline-manager";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(offlineManager.online);
  const [pendingCount, setPendingCount] = useState(offlineManager.pendingCount);

  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange((online) => {
      setIsOnline(online);
      setPendingCount(offlineManager.pendingCount);
    });
    return unsubscribe;
  }, []);

  return { isOnline, pendingCount };
}

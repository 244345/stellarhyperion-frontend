"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import styles from "./OfflineBanner.module.css";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return typeof navigator !== "undefined" ? !navigator.onLine : false;
}

function getServerSnapshot(): boolean {
  return false;
}

export function OfflineBanner(): ReactElement | null {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) {
    return null;
  }

  return (
    <aside className={styles.banner} role="status" aria-live="polite">
      <span className={styles.indicatorDot} aria-hidden="true" />
      <span className={styles.message}>
        Network connection lost. Hyperion is operating in offline mode.
      </span>
    </aside>
  );
}

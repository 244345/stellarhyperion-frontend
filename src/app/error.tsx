"use client";

import { useEffect, type ReactElement } from "react";
import styles from "./error.module.css";

interface ErrorBoundaryProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps): ReactElement {
  useEffect(() => {
    console.error("Application error boundary caught error:", error);
  }, [error]);

  return (
    <main className={styles.errorContainer} role="alert" aria-live="assertive">
      <div className={styles.errorCard}>
        <span className={styles.errorTag}>unhandled runtime error</span>
        <h1 className={styles.errorTitle}>An unexpected error occurred</h1>
        <p className={styles.errorMessage}>
          The application encountered an unexpected exception while processing state. You can retry
          the action or reload the interface.
        </p>
        {error.message && <div className={styles.errorDigest}>{error.message}</div>}
        <button
          type="button"
          className={styles.retryBtn}
          onClick={() => {
            reset();
          }}
        >
          Retry action
        </button>
      </div>
    </main>
  );
}

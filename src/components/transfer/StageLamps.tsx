"use client";

import type { ReactElement } from "react";
import styles from "./StageLamps.module.css";

export type StageState = "idle" | "active" | "completed" | "failed";

export interface Stage {
  readonly id: string;
  readonly name: string;
  readonly detail?: string | undefined;
  readonly state: StageState;
  readonly eta?: string | undefined;
  readonly elapsed?: string | undefined;
}

interface StageLampsProps {
  readonly stages: readonly Stage[];
  readonly currentStageId?: string | undefined;
  readonly etaLabel?: string | undefined;
  readonly elapsedText?: string | undefined;
}

export function StageLamps({ stages, etaLabel, elapsedText }: StageLampsProps): ReactElement {
  return (
    <div className={styles.container} role="status" aria-label="Transfer stage progress">
      <div className={styles.headerRow}>
        <span className={styles.heading}>transfer progression</span>
        {(etaLabel ?? elapsedText) && (
          <div className={styles.timingMeta} role="timer" aria-live="off">
            {elapsedText && <span className={styles.elapsedBadge}>{elapsedText}</span>}
            {etaLabel && <span className={styles.etaBadge}>{etaLabel}</span>}
          </div>
        )}
      </div>
      <div className={styles.stagesList}>
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const lampClass =
            stage.state === "completed"
              ? styles.lampCompleted
              : stage.state === "active"
                ? styles.lampActive
                : stage.state === "failed"
                  ? styles.lampFailed
                  : styles.lampIdle;

          return (
            <div key={stage.id} className={styles.stageItem}>
              <span className={`${styles.lamp} ${lampClass}`} aria-hidden="true" />
              <div>
                <span className={styles.stageName}>{stage.name}</span>
                {stage.detail && <span className={styles.stageDetail}> ({stage.detail})</span>}
                {stage.state === "active" && stage.eta && (
                  <span className={styles.stageEta}> ~{stage.eta} remaining</span>
                )}
              </div>
              {!isLast && <span className={styles.connector} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

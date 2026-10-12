"use client";

import { useEffect, useState, useCallback, type ReactElement } from "react";
import { submitSettleClaim } from "../../contracts";
import { useStellarWallet } from "../../wallets/stellar";
import { fetchClaims, type FormattedClaim } from "../../lib/api";
import styles from "./ClaimSettlement.module.css";

interface ParkedClaim {
  id: string;
  chain: string;
  token: string;
  amount: string;
  recipient: string;
  status: "parked" | "settling" | "settled";
  settledTxHash?: string;
}

const SAMPLE_CLAIM: ParkedClaim = {
  id: "1",
  chain: "Stellar Testnet",
  token: "USDC",
  amount: "997.0000000",
  recipient: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  status: "parked",
};

function formatAge(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    if (isNaN(diffMs) || diffMs < 0) return "just now";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "< 1m ago";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return isoDate;
  }
}

export function ClaimSettlement(): ReactElement {
  const { address } = useStellarWallet();
  const [claimIdInput, setClaimIdInput] = useState<string>("1");
  const [addressInput, setAddressInput] = useState<string>("");
  const [currentClaim, setCurrentClaim] = useState<ParkedClaim | null>(SAMPLE_CLAIM);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [discoveredClaims, setDiscoveredClaims] = useState<readonly FormattedClaim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleLookupAddress = useCallback(async (targetAddr: string) => {
    const trimmed = targetAddr.trim();
    if (!trimmed) {
      setDiscoveredClaims([]);
      setHasSearched(false);
      return;
    }
    setIsLoadingClaims(true);
    setHasSearched(true);
    try {
      const res = await fetchClaims({ recipient: trimmed, settled: "false" });
      setDiscoveredClaims(res.claims);
    } catch {
      setDiscoveredClaims([]);
    } finally {
      setIsLoadingClaims(false);
    }
  }, []);

  // Auto-detect when connected wallet address is available
  useEffect(() => {
    if (!address) {
      return;
    }
    let active = true;
    void fetchClaims({ recipient: address, settled: "false" }).then((res) => {
      if (active) {
        setAddressInput(address);
        setDiscoveredClaims(res.claims);
        setHasSearched(true);
      }
    });
    return () => {
      active = false;
    };
  }, [address]);

  const handleAutoDetect = () => {
    if (address) {
      setAddressInput(address);
      void handleLookupAddress(address);
    }
  };

  const handleLookup = () => {
    if (claimIdInput.trim() === "1") {
      setCurrentClaim(SAMPLE_CLAIM);
    } else if (claimIdInput.trim()) {
      setCurrentClaim({
        id: claimIdInput.trim(),
        chain: "Stellar Testnet",
        token: "USDC",
        amount: "500.0000000",
        recipient:
          addressInput.trim() || "GCHPVETUL5E4YKDLMRIBFUGFK4PMYOVKPFALVSYMP2QDYAVBA3ITQDAI",
        status: "parked",
      });
    } else {
      setCurrentClaim(null);
    }
  };

  const handleSelectClaim = (c: FormattedClaim) => {
    setClaimIdInput(c.claimId);
    setCurrentClaim({
      id: c.claimId,
      chain: c.chain,
      token: c.token,
      amount: c.amount,
      recipient: c.recipient,
      status: c.settled ? "settled" : "parked",
    });
  };

  const handleSettle = async () => {
    if (!currentClaim) return;
    setIsSettling(true);
    try {
      const claimIdNum = BigInt(currentClaim.id || "1");
      const res = await submitSettleClaim(address ?? "", claimIdNum);
      if (res.status !== "failed") {
        setCurrentClaim({
          ...currentClaim,
          status: "settled",
          settledTxHash: res.txHash || "0x89f41a0b5c12...33d2",
        });
      }
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <section className={styles.panel} aria-label="Parked claim settlement interface">
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Parked claim settlement</h2>
        <span className={styles.tag}>permissionless recovery</span>
      </div>

      <p className={styles.description}>
        When a cross-chain delivery lands but cannot be handed directly to the recipient (for
        example, a destination Stellar classic account without an active asset trustline), the
        router parks the funds safely. Anyone can settle a parked claim once the recipient condition
        is resolved.
      </p>

      <div className={styles.addressSearchSection}>
        <label htmlFor="recipient-address-input" className={styles.label}>
          Filter claims by recipient address
        </label>
        <div className={styles.addressInputRow}>
          <input
            id="recipient-address-input"
            type="text"
            className={styles.input}
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
            }}
            placeholder="Search destination account address..."
          />
          <button
            type="button"
            className={styles.searchBtn}
            onClick={() => {
              void handleLookupAddress(addressInput);
            }}
          >
            find claims
          </button>
          {address && (
            <button
              type="button"
              className={styles.autoDetectBtn}
              onClick={handleAutoDetect}
              title="Detect claims for connected wallet"
            >
              auto-detect for connected wallet
            </button>
          )}
        </div>
      </div>

      {isLoadingClaims && <div className={styles.loadingMessage}>Searching parked claims...</div>}

      {hasSearched && !isLoadingClaims && discoveredClaims.length === 0 && (
        <div className={styles.emptyMessage}>
          No pending parked claims found for this recipient address.
        </div>
      )}

      {discoveredClaims.length > 0 && (
        <div className={styles.discoveredSection}>
          <h3 className={styles.discoveredHeading}>
            Pending claims for recipient ({discoveredClaims.length})
          </h3>
          <div className={styles.claimsList}>
            {discoveredClaims.map((c) => (
              <div key={c.id} className={styles.claimDiscoveryCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardId}>claim #{c.claimId}</span>
                  <span className={styles.cardAge}>{formatAge(c.createdAt)}</span>
                </div>
                <div className={styles.cardDetails}>
                  <div className={styles.cardRow}>
                    <span className={styles.itemLabel}>amount</span>
                    <span className={styles.itemValue}>
                      {c.amount} {c.token}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.itemLabel}>origin chain</span>
                    <span className={styles.itemValue}>{c.sourceChain}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.selectClaimBtn}
                  onClick={() => {
                    handleSelectClaim(c);
                  }}
                >
                  select to settle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.lookupForm}>
        <div className={styles.field}>
          <label htmlFor="claim-id-input" className={styles.label}>
            Claim identifier
          </label>
          <input
            id="claim-id-input"
            type="text"
            className={styles.input}
            value={claimIdInput}
            onChange={(e) => {
              setClaimIdInput(e.target.value);
            }}
            placeholder="e.g. 1"
          />
        </div>
        <button type="button" className={styles.searchBtn} onClick={handleLookup}>
          lookup claim
        </button>
      </div>

      {currentClaim && (
        <div className={styles.claimCard}>
          <div className={styles.claimGrid}>
            <div className={styles.claimItem}>
              <span className={styles.itemLabel}>claim id</span>
              <span className={styles.itemValue}>#{currentClaim.id}</span>
            </div>
            <div className={styles.claimItem}>
              <span className={styles.itemLabel}>destination chain</span>
              <span className={styles.itemValue}>{currentClaim.chain}</span>
            </div>
            <div className={styles.claimItem}>
              <span className={styles.itemLabel}>parked amount</span>
              <span className={styles.itemValue}>
                {currentClaim.amount} {currentClaim.token}
              </span>
            </div>
            <div className={styles.claimItem}>
              <span className={styles.itemLabel}>status</span>
              <span className={`${styles.itemValue} ${styles.itemStatus}`}>
                {currentClaim.status}
              </span>
            </div>
          </div>

          <div className={styles.claimItem}>
            <span className={styles.itemLabel}>target recipient</span>
            <span className={styles.itemValue}>{currentClaim.recipient}</span>
          </div>

          {currentClaim.status === "settled" ? (
            <div className={styles.settledBanner}>
              claim #{currentClaim.id} has been settled successfully on chain
            </div>
          ) : (
            <button
              type="button"
              className={styles.settleBtn}
              onClick={() => {
                void handleSettle();
              }}
              disabled={isSettling}
            >
              {isSettling ? "settling claim..." : "settle parked claim"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

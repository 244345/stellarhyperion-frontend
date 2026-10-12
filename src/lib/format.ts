/**
 * Format and explorer deep link helpers for Hyperion.
 *
 * Resolves chain-specific block explorer deep links for transactions and accounts
 * across Stellar and supported EVM networks.
 */

import { getRouteName, type FormattedTransfer } from "../api/backend";

export function shortenAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export function shortenTxHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Returns the block explorer deep link for a transaction hash or account address
 * given the specific network chain key.
 */
export function getExplorerUrl(chainKey: string, type: "tx" | "address", id: string): string {
  const cleanId = encodeURIComponent(id.trim());
  const normalizedKey = chainKey.trim().toLowerCase();

  switch (normalizedKey) {
    case "stellar-testnet": {
      if (type === "tx") {
        return `https://stellar.expert/explorer/testnet/tx/${cleanId}`;
      }
      const isContract = id.trim().startsWith("C");
      const pathSegment = isContract ? "contract" : "account";
      return `https://stellar.expert/explorer/testnet/${pathSegment}/${cleanId}`;
    }

    case "stellar":
    case "stellar-public": {
      if (type === "tx") {
        return `https://stellar.expert/explorer/public/tx/${cleanId}`;
      }
      const isContract = id.trim().startsWith("C");
      const pathSegment = isContract ? "contract" : "account";
      return `https://stellar.expert/explorer/public/${pathSegment}/${cleanId}`;
    }

    case "sepolia":
    case "ethereum-sepolia": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://sepolia.etherscan.io/${segment}/${cleanId}`;
    }

    case "base-sepolia": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://sepolia.basescan.org/${segment}/${cleanId}`;
    }

    case "arbitrum-sepolia": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://sepolia.arbiscan.io/${segment}/${cleanId}`;
    }

    case "arc-testnet": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://explorer.testnet.arc.io/${segment}/${cleanId}`;
    }

    case "ethereum":
    case "mainnet": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://etherscan.io/${segment}/${cleanId}`;
    }

    case "base": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://basescan.org/${segment}/${cleanId}`;
    }

    case "arc": {
      const segment = type === "tx" ? "tx" : "address";
      return `https://explorer.arc.io/${segment}/${cleanId}`;
    }

    default: {
      const segment = type === "tx" ? "tx" : "address";
      return `https://sepolia.etherscan.io/${segment}/${cleanId}`;
    }
  }
}

/**
 * Escapes a field according to RFC 4180 rules.
 */
export function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a list of transfers into an RFC 4180 compliant CSV string.
 */
export function formatTransfersAsCsv(transfers: readonly FormattedTransfer[]): string {
  const headers = [
    "Date (ISO)",
    "Origin Tx Hash",
    "Origin Chain",
    "Destination Chain",
    "Route / Rail",
    "Token",
    "Gross Amount",
    "Fee",
    "Net Amount",
    "Status",
  ];

  const rows = transfers.map((t) => [
    escapeCsvField(t.origin.observedAt),
    escapeCsvField(t.origin.txHash),
    escapeCsvField(t.origin.chain),
    escapeCsvField(t.destination.chain),
    escapeCsvField(getRouteName(t.route)),
    escapeCsvField(t.origin.token),
    escapeCsvField(t.origin.grossAmount),
    escapeCsvField(t.origin.fee),
    escapeCsvField(t.origin.netAmount),
    escapeCsvField(t.stage),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Formats a list of transfers into pretty-printed JSON.
 */
export function formatTransfersAsJson(transfers: readonly FormattedTransfer[]): string {
  return JSON.stringify(transfers, null, 2);
}

/**
 * Generates standard formatted filename based on current date.
 */
export function getExportFilename(extension: "csv" | "json", date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `hyperion-transfers-${yyyy}-${mm}-${dd}.${extension}`;
}

/**
 * Triggers a browser file download without external dependencies.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { describe, expect, it } from "vitest";
import { RouteKind } from "@hyperion/protocol";
import { formatElapsed, getRouteDurationProfile } from "../src/components/transfer/TransferFlow";
import {
  escapeCsvField,
  formatTransfersAsCsv,
  formatTransfersAsJson,
  getExportFilename,
} from "../src/lib/format";
import { fetchClaims, FIXTURE_TRANSFERS } from "../src/lib/api";
import { OfflineBanner } from "../src/components/common/OfflineBanner";
import ErrorBoundary from "../src/app/error";

describe("Issue #3: Rail Duration Profiles & Live Elapsed Timer", () => {
  it("provides estimated durations for each supported rail", () => {
    const cctp = getRouteDurationProfile(RouteKind.Cctp);
    expect(cctp.totalLabel).toContain("18m");
    expect(cctp.stageEstimates.attest).toBeDefined();

    const axelar = getRouteDurationProfile(RouteKind.AxelarIts);
    expect(axelar.totalLabel).toContain("2m");

    const gmp = getRouteDurationProfile(RouteKind.AxelarGmp);
    expect(gmp.totalLabel).toContain("2m");

    const allbridge = getRouteDurationProfile(RouteKind.Allbridge);
    expect(allbridge.totalLabel).toContain("1m");
  });

  it("formats elapsed time into standard mm:ss format", () => {
    expect(formatElapsed(0)).toBe("00:00 elapsed");
    expect(formatElapsed(65)).toBe("01:05 elapsed");
    expect(formatElapsed(84)).toBe("01:24 elapsed");
    expect(formatElapsed(3600)).toBe("60:00 elapsed");
  });
});

describe("Issue #4: Parked Claim Query & Recipient Filtering", () => {
  it("filters claims by recipient address", async () => {
    const targetAddr = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
    const res = await fetchClaims({ recipient: targetAddr });
    expect(res.claims.length).toBeGreaterThan(0);
    expect(res.claims.every((c) => c.recipient.toLowerCase() === targetAddr.toLowerCase())).toBe(
      true,
    );
  });

  it("returns empty claims list when recipient has no parked claims", async () => {
    const res = await fetchClaims({ recipient: "0x0000000000000000000000000000000000000000" });
    expect(res.claims.length).toBe(0);
  });
});

describe("Issue #5: RFC 4180 CSV & JSON History Export", () => {
  it("escapes fields with special characters per RFC 4180", () => {
    expect(escapeCsvField("simple")).toBe("simple");
    expect(escapeCsvField("with,comma")).toBe('"with,comma"');
    expect(escapeCsvField('with"quote')).toBe('"with""quote"');
    expect(escapeCsvField("with\nnewline")).toBe('"with\nnewline"');
    expect(escapeCsvField(null)).toBe("");
  });

  it("exports valid CSV structure with required headers", () => {
    const csv = formatTransfersAsCsv(FIXTURE_TRANSFERS);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "Date (ISO),Origin Tx Hash,Origin Chain,Destination Chain,Route / Rail,Token,Gross Amount,Fee,Net Amount,Status",
    );
    expect(lines.length).toBe(FIXTURE_TRANSFERS.length + 1);
  });

  it("exports valid pretty-printed JSON", () => {
    const jsonStr = formatTransfersAsJson(FIXTURE_TRANSFERS);
    const parsed = JSON.parse(jsonStr) as readonly unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(FIXTURE_TRANSFERS.length);
  });

  it("generates correct date-stamped export filenames", () => {
    const fixedDate = new Date(2026, 9, 12);
    expect(getExportFilename("csv", fixedDate)).toBe("hyperion-transfers-2026-10-12.csv");
    expect(getExportFilename("json", fixedDate)).toBe("hyperion-transfers-2026-10-12.json");
  });
});

describe("Issue #6: Error Boundary & Offline Indicator", () => {
  it("exports ErrorBoundary and OfflineBanner components", () => {
    expect(ErrorBoundary).toBeDefined();
    expect(OfflineBanner).toBeDefined();
  });
});

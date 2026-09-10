import { describe, expect, it, vi } from "vitest";
import { HEALTH_TIMEOUT_MS, classifyStatus, probeApiHealth } from "../health";

/**
 * One test per row of the mapping table in
 * `specs/001-solution-scaffold/contracts/health.md` §2. The C# side is written against
 * the same table, so a change here that nobody notices changes the other repository's
 * meaning.
 */

const BASE = "http://api.test";
const FIXED_NOW = () => new Date("2026-09-10T01:23:45.000Z");

// Typed as `typeof fetch` so the recorded calls carry fetch's argument tuple — without
// it, mock.calls[0][0] is `never` and the assertions below cannot be written at all.
function respondWith(status: number) {
  return vi.fn<typeof fetch>(async () => new Response(null, { status }));
}

function failWith(error: Error) {
  return vi.fn<typeof fetch>(async () => {
    throw error;
  });
}

describe("classifyStatus", () => {
  it("maps 200 to ready", () => {
    expect(classifyStatus(200)).toBe("ready");
  });

  it("maps 503 to degraded", () => {
    expect(classifyStatus(503)).toBe("degraded");
  });

  it.each([500, 502, 404, 401, 301])("maps unexpected status %i to unreachable", (status) => {
    // An answer we cannot believe is not better than no answer.
    expect(classifyStatus(status)).toBe("unreachable");
  });

  it("never collapses degraded into unreachable", () => {
    // The distinction is the point: one means the API answered and told the truth about
    // itself, the other means it never answered. Merging them sends whoever is
    // debugging to the wrong process.
    expect(classifyStatus(503)).not.toBe(classifyStatus(500));
  });
});

describe("probeApiHealth", () => {
  it("reports ready when the API answers 200", async () => {
    const result = await probeApiHealth({ baseUrl: BASE, fetchImpl: respondWith(200), now: FIXED_NOW });
    expect(result.api).toBe("ready");
  });

  it("reports degraded when the API answers 503", async () => {
    const result = await probeApiHealth({ baseUrl: BASE, fetchImpl: respondWith(503), now: FIXED_NOW });
    expect(result.api).toBe("degraded");
  });

  it("reports unreachable on a timeout", async () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");
    const result = await probeApiHealth({ baseUrl: BASE, fetchImpl: failWith(timeout), now: FIXED_NOW });
    expect(result.api).toBe("unreachable");
  });

  it("reports unreachable when the connection is refused", async () => {
    const refused = Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } });
    const result = await probeApiHealth({ baseUrl: BASE, fetchImpl: failWith(refused), now: FIXED_NOW });
    expect(result.api).toBe("unreachable");
  });

  it("reports unreachable when DNS fails", async () => {
    const dns = Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });
    const result = await probeApiHealth({ baseUrl: BASE, fetchImpl: failWith(dns), now: FIXED_NOW });
    expect(result.api).toBe("unreachable");
  });

  it("never throws, whatever the transport does", async () => {
    // The BFF succeeded at finding out. Only the answer is bad news, and a health probe
    // that throws takes the page down with it.
    const result = probeApiHealth({ baseUrl: BASE, fetchImpl: failWith(new Error("anything at all")), now: FIXED_NOW });
    await expect(result).resolves.toMatchObject({ api: "unreachable" });
  });

  it("stamps checkedAt as UTC ISO 8601", async () => {
    const result = await probeApiHealth({ baseUrl: BASE, fetchImpl: respondWith(200), now: FIXED_NOW });

    // Contract §3: UTC, Z-suffixed. Never a local time, never an offset.
    expect(result.checkedAt).toBe("2026-09-10T01:23:45.000Z");
    expect(result.checkedAt.endsWith("Z")).toBe(true);
  });

  it("calls readiness once and does not retry", async () => {
    const fetchImpl = failWith(new Error("down"));
    await probeApiHealth({ baseUrl: BASE, fetchImpl, now: FIXED_NOW });

    // A probe that retries reports a stale truth (contract §3).
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("asks the readiness endpoint, not liveness", async () => {
    const fetchImpl = respondWith(200);
    await probeApiHealth({ baseUrl: `${BASE}/`, fetchImpl, now: FIXED_NOW });

    // Also proves a trailing slash on the configured base does not produce a double
    // slash — the kind of thing that 404s only in the one environment that has it.
    expect(fetchImpl.mock.calls[0][0]).toBe("http://api.test/health/ready");
  });

  it("applies the contract's timeout", async () => {
    const fetchImpl = respondWith(200);
    await probeApiHealth({ baseUrl: BASE, fetchImpl, now: FIXED_NOW });

    const init = fetchImpl.mock.calls[0][1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(HEALTH_TIMEOUT_MS).toBe(10_000);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The route the browser actually calls.
 *
 * Declared as T040 and T041 in phase 4 and never written: the 18 tests filed under that
 * phase all target `health.ts`, one layer below, and the phase reported "20 tests pass"
 * while `/api/health` had none. The helper being correct is not the same as the route
 * being correct — the route is where the environment, the error handling, the status code
 * and the cache header live, and every one of those is a place the contract can be broken
 * without a single mapping test noticing.
 *
 * `api-client` is mocked rather than the network: it carries `import "server-only"`,
 * which resolves to a bare `throw` outside a React Server Component.
 */
vi.mock("@/lib/api-client", () => ({
  getApiHealth: vi.fn(),
}));

const { getApiHealth } = await import("@/lib/api-client");
const { GET } = await import("../route");

const probe = vi.mocked(getApiHealth);

beforeEach(() => {
  probe.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/health", () => {
  // One row per contract §2 outcome: 200 -> ready, 503 -> degraded, anything else or
  // no answer at all -> unreachable. The route's job is to pass the verdict through
  // without editing it.
  it.each(["ready", "degraded", "unreachable"] as const)("passes %s through unchanged", async (api) => {
    probe.mockResolvedValue({ api, checkedAt: "2026-09-10T01:23:45.000Z" });

    const response = await GET();
    const body = await response.json();

    expect(body.api).toBe(api);
    expect(body.checkedAt).toBe("2026-09-10T01:23:45.000Z");
  });

  it.each(["ready", "degraded", "unreachable"] as const)(
    "answers 200 even when the API is %s",
    async (api) => {
      // T041. Reachability is data, not a transport failure of ours. Answering 503 here
      // would make the browser's own origin look broken when the broken thing is one hop
      // further away — and the contract has no word for that.
      probe.mockResolvedValue({ api, checkedAt: "2026-09-10T01:23:45.000Z" });

      const response = await GET();

      expect(response.status).toBe(200);
    },
  );

  it("never caches", async () => {
    // A cached health answer is a lie with a timestamp on it.
    probe.mockResolvedValue({ api: "ready", checkedAt: "2026-09-10T01:23:45.000Z" });

    const response = await GET();

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports unreachable when the API address is not configured", async () => {
    probe.mockRejectedValue(new Error("No API base address. Set 'FITFORGE_API_BASE_URL'"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.api).toBe("unreachable");
  });

  it("tells the server log what the browser is not told", async () => {
    // The browser gets "unreachable", which is all three failures look like from there.
    // The operator gets the actual reason — without this, a missing environment variable
    // is indistinguishable from a stopped API, and sends them to the wrong process.
    const error = new Error("No API base address. Set 'FITFORGE_API_BASE_URL'");
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    probe.mockRejectedValue(error);

    await GET();

    expect(logged).toHaveBeenCalledOnce();
    expect(logged.mock.calls[0]).toContain(error);
  });

  it("never throws, whatever the probe does", async () => {
    // This route is called from the root layout's health indicator. A throw here is a
    // 500 on every page.
    probe.mockRejectedValue("not even an Error");
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(GET()).resolves.toBeDefined();
  });

  it("stamps its own checkedAt when the probe could not run", async () => {
    probe.mockRejectedValue(new Error("nope"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const body = await (await GET()).json();

    // Contract §3: UTC, Z-suffixed, on the failure path too.
    expect(body.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * T086 and T087 — FR-007: an unauthenticated visitor is redirected to sign-in **without
 * member data being rendered**, and the sign-in screen renders with no app shell
 * (VI-015).
 *
 * Two of these test source structure rather than behaviour, deliberately. VI-015 is
 * upheld by a route group, and the failure mode is not "the shell renders wrongly" but
 * "somebody adds the shell back", which a rendering test of today's tree would not
 * notice.
 */

const APP_LAYOUT = join(process.cwd(), "src/app/(app)/layout.tsx");
const AUTH_LAYOUT = join(process.cwd(), "src/app/(auth)/layout.tsx");
const ROOT_LAYOUT = join(process.cwd(), "src/app/layout.tsx");

const SHELL = ["Header", "Sidebar", "BottomNav"] as const;

describe("the sign-in route renders no app shell", () => {
  it("the (auth) layout renders no shell component", () => {
    const source = readFileSync(AUTH_LAYOUT, "utf8");

    for (const component of SHELL) {
      expect(source).not.toContain(component);
    }
  });

  it("the ROOT layout renders no shell component either", () => {
    // The one that actually matters. The shell lived here until feature 002 phase 7,
    // and putting it back would silently reinstate it on sign-in — VI-015 broken with
    // no test failing anywhere else, because every authenticated screen would still
    // look correct.
    const source = readFileSync(ROOT_LAYOUT, "utf8");

    for (const component of SHELL) {
      expect(source).not.toContain(component);
    }
  });

  it("the (app) layout is where the shell lives", () => {
    // The companion. Without it, deleting the shell entirely would pass both tests
    // above and leave the authenticated screens with no navigation at all.
    const source = readFileSync(APP_LAYOUT, "utf8");

    for (const component of SHELL) {
      expect(source).toContain(component);
    }
  });
});

describe("an unauthenticated visitor never reaches an authenticated route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  /** Next's `redirect()` throws; this stands in for that so the call is observable. */
  class Redirected extends Error {
    constructor(readonly to: string) {
      super(`redirect:${to}`);
    }
  }

  async function renderLayoutWith(session: {
    token?: string;
    me?: { ok: boolean; status?: number | null };
  }) {
    const redirect = vi.fn((to: string) => {
      throw new Redirected(to);
    });

    vi.doMock("next/navigation", () => ({ redirect }));
    vi.doMock("@/lib/session", () => ({
      readSessionToken: async () => session.token,
    }));

    const getMe = vi.fn(async () =>
      session.me?.ok
        ? { ok: true, value: { member: { displayName: "Ada" }, profile: {} } }
        : { ok: false, status: session.me?.status ?? 401, title: "Not signed in." },
    );

    vi.doMock("@/lib/api-auth", () => ({ getMe }));

    const { default: AppLayout } = await import("../(app)/layout");

    let thrown: unknown;
    let rendered: unknown;

    try {
      rendered = await AppLayout({ children: "MEMBER DATA WOULD BE HERE" } as never);
    } catch (error) {
      thrown = error;
    }

    return { redirect, getMe, thrown, rendered };
  }

  it("redirects when there is no cookie at all", async () => {
    const { redirect, getMe, thrown, rendered } = await renderLayoutWith({});

    expect(redirect).toHaveBeenCalledWith("/sign-in");
    expect(thrown).toBeInstanceOf(Redirected);

    // Nothing rendered — the children never became part of a tree. This is the half of
    // FR-007 that a status-code assertion would miss.
    expect(rendered).toBeUndefined();

    // And no call to the API: a request with no cookie costs nothing.
    expect(getMe).not.toHaveBeenCalled();
  });

  it("redirects when the cookie exists but the session is not usable", async () => {
    // The case a cookie-presence check in middleware would get wrong, and the reason
    // the decision lives in one place. Expired, revoked and belonging-to-a-deleted-
    // member all look identical from the cookie.
    const { redirect, getMe, rendered } = await renderLayoutWith({
      token: "a-stale-token",
      me: { ok: false, status: 401 },
    });

    expect(getMe).toHaveBeenCalledWith("a-stale-token");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
    expect(rendered).toBeUndefined();
  });

  it("redirects when the API cannot be reached, rather than rendering an empty shell", async () => {
    // Rendering the shell with no member would show an empty or stale name. Sending
    // them to sign in is not worse, and it is honest about not knowing who they are.
    const { redirect, rendered } = await renderLayoutWith({
      token: "a-good-token",
      me: { ok: false, status: null },
    });

    expect(redirect).toHaveBeenCalledWith("/sign-in");
    expect(rendered).toBeUndefined();
  });

  it("renders the shell for a usable session", async () => {
    // The companion that keeps the three above honest: a layout that redirected
    // unconditionally would pass every one of them.
    const { redirect, rendered } = await renderLayoutWith({
      token: "a-good-token",
      me: { ok: true },
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(rendered).toBeDefined();
  });
});

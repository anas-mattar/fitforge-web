import "server-only";

import { probeApiHealth, type HealthPayload } from "./health";

/**
 * The only module that knows where the C# API lives.
 *
 * `import "server-only"` is the enforcement, not the comment: a client component that
 * imports this fails the build instead of quietly shipping the API's address in the
 * bundle. ADR-001 §4.6 — the browser talks to this application's own origin and nothing
 * else, and the BFF is the only caller of the API.
 */

/**
 * Read the API's address. Deliberately read per call rather than cached at module load:
 * a module-level read runs during the build, where the variable is often absent, and
 * would bake an empty string into the server bundle.
 */
function getApiBaseUrl(): string {
  const baseUrl = process.env.FITFORGE_API_BASE_URL;

  if (!baseUrl) {
    // Named the way the API names its own missing setting — the same failure should
    // read the same way whichever half of the system you are standing in.
    throw new Error(
      "No API base address. Set 'FITFORGE_API_BASE_URL' in the environment " +
        "(see .env.example, which carries the name and never the value).",
    );
  }

  return baseUrl;
}

/** Ask the C# API whether it is ready, per contracts/health.md §2. */
export function getApiHealth(): Promise<HealthPayload> {
  return probeApiHealth({ baseUrl: getApiBaseUrl() });
}

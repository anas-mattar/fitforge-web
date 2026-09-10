import "server-only";

import { apiBaseUrl } from "./api-client";
import { postRegister, postSignIn, postSignOut } from "./auth-transport";

/**
 * Supplies the API's address to `auth-transport.ts`, and is the module that carries
 * `server-only`.
 *
 * The split is feature 001's, between `api-client.ts` and `health.ts`: the marker
 * belongs on the module that reads the environment, so the module holding the rules
 * stays testable. A client component importing THIS fails the build, which is the
 * enforcement invariant 7 needs.
 */

export type { ApiResult, Credentialed } from "./auth-transport";

export const register = (email: string, password: string, displayName: string) =>
  postRegister(apiBaseUrl(), email, password, displayName);

export const signIn = (email: string, password: string) =>
  postSignIn(apiBaseUrl(), email, password);

export const signOut = (token: string) => postSignOut(apiBaseUrl(), token);

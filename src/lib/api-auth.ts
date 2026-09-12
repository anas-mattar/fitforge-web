import "server-only";

import { apiBaseUrl } from "./api-client";
import { getMe as transportGetMe, postRegister, postSignIn, postSignOut } from "./auth-transport";

/**
 * Supplies the API's address to `auth-transport.ts`, and is the module that carries
 * `server-only`.
 *
 * The split is feature 001's, between `api-client.ts` and `health.ts`: the marker
 * belongs on the module that reads the environment, so the module holding the rules
 * stays testable. A client component importing THIS fails the build, which is the
 * enforcement invariant 7 needs.
 */

export type { ApiResult, Credentialed, Me } from "./auth-transport";

export const register = (
  email: string,
  password: string,
  displayName: string,
  sourceAddress: string | null,
) => postRegister(apiBaseUrl(), email, password, displayName, sourceAddress);

export const signIn = (email: string, password: string, sourceAddress: string | null) =>
  postSignIn(apiBaseUrl(), email, password, sourceAddress);

export const signOut = (token: string) => postSignOut(apiBaseUrl(), token);

export const getMe = (token: string) => transportGetMe(apiBaseUrl(), token);

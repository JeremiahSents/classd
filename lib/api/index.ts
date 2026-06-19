/**
 * The single API entry point for the whole app.
 *
 *   import { api } from "@/lib/api";
 *   const classes = await api.listClasses();
 *
 * Which implementation runs is controlled by EXPO_PUBLIC_API_BACKEND:
 *   "mock"     (default) → in-memory seed data, no backend needed
 *   "firebase"           → real Firebase backend (firebase-impl.ts)
 *
 * Never import mock-impl / firebase-impl directly from screens — always go
 * through this `api` object so the rest of the app stays backend-agnostic.
 */

import type { ClassdApi } from "./contract";
import { mockApi } from "./mock-impl";
import { firebaseApi } from "./firebase-impl";

const backend = process.env.EXPO_PUBLIC_API_BACKEND ?? "mock";

export const api: ClassdApi = backend === "firebase" ? firebaseApi : mockApi;

export * from "./contract";

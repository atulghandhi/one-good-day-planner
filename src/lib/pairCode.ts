import type { PlannerState } from "@/features/planner/types";

/**
 * Compact encoding of today's planner state for cross-device transfer.
 * Goes into a URL fragment (#d=…) so it never reaches a server.
 */

const VERSION = 1;

type Encoded = {
  v: number;
  d: string; // date ISO
  s: PlannerState;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeState(date: string, state: PlannerState): string {
  const payload: Encoded = { v: VERSION, d: date, s: state };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeState(token: string): Encoded | null {
  try {
    const bytes = base64UrlToBytes(token);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Encoded;
    if (!parsed || parsed.v !== VERSION || typeof parsed.d !== "string" || !parsed.s) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildPairUrl(date: string, state: PlannerState): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const token = encodeState(date, state);
  return `${origin}/receive#d=${token}`;
}

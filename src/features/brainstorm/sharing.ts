import { normalizeBrainstormState } from "./storage";
import type { BrainstormState } from "./types";

export function encodeUrlBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeUrlBase64(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBrainstormShare(state: BrainstormState) {
  return encodeUrlBase64(JSON.stringify({ ...state, version: 3 }));
}

export function decodeBrainstormShare(value: string): BrainstormState | null {
  try {
    return normalizeBrainstormState(JSON.parse(decodeUrlBase64(value)));
  } catch {
    return null;
  }
}

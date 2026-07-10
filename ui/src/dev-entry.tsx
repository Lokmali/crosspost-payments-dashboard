import type { ClientRuntimeConfig } from "everything-dev/types";
import { hydrate } from "./hydrate";
import "./styles.css";

declare const __STANDALONE_RUNTIME_CONFIG__: ClientRuntimeConfig;

window.__RUNTIME_CONFIG__ = __STANDALONE_RUNTIME_CONFIG__;

void hydrate().catch((error: unknown) => {
  console.error("[Dev] Failed to start app:", error);
  const message = error instanceof Error ? error.message : String(error);
  document.body.innerHTML = `<div style="padding:2rem;font-family:system-ui,sans-serif;max-width:720px;margin:0 auto"><h1 style="font-size:1.25rem;margin-bottom:0.75rem">App failed to start</h1><pre style="white-space:pre-wrap;background:#f4f4f5;padding:1rem;border-radius:0.5rem">${message}</pre></div>`;
});
/**
 * Talking to the companion running on the visitor's own machine.
 *
 * The browser cannot read a filesystem, and the API server lives in a datacenter — so neither can
 * answer "which AI CLIs are installed here". The companion can, and loopback is where the two halves
 * meet: browsers treat `127.0.0.1` as a trustworthy origin, so an HTTPS page is permitted to reach a
 * plain-HTTP local service.
 *
 * Everything here is best-effort. A missing companion is the normal case, not an error, so every
 * failure path resolves to `null` rather than throwing — the page must work identically without it.
 */

const DEFAULT_PORT = 19519;
/** Kept short: this runs on every page load and a closed port should cost nothing perceptible. */
const PROBE_TIMEOUT_MS = 1_500;
const PAIR_TIMEOUT_MS = 15_000;

export interface LocalCompanionInfo {
  product: string;
  runtimeVersion: string;
  machineName: string;
  os: string;
  arch: string;
  paired: boolean;
  machineId?: string;
}

function baseUrl(): string {
  const port = process.env.NEXT_PUBLIC_RUNTIME_PORT?.trim() || String(DEFAULT_PORT);
  return `http://127.0.0.1:${port}`;
}

/**
 * Look for a companion on this machine.
 *
 * Returns `null` for every unhappy outcome — nothing listening, a firewall, Safari refusing the
 * loopback request, Chrome's Private Network Access check, or some unrelated service occupying the
 * port. None of those are worth surfacing to the user, because the manual pairing flow still works.
 */
export async function probeLocalCompanion(): Promise<LocalCompanionInfo | null> {
  try {
    const response = await fetch(`${baseUrl()}/info`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const info = (await response.json()) as LocalCompanionInfo;
    // Guard against something unrelated answering on this port.
    return info?.product === "devflow-runtime" ? info : null;
  } catch {
    return null;
  }
}

/**
 * Hand a pairing code to the local companion so it can register itself.
 *
 * Only the code travels. The companion uses the server URL it was configured with, which is what
 * stops a page from redirecting someone's machine at a server of its choosing.
 *
 * The custom header is required by the companion: it forces a CORS preflight, which a plain HTML
 * form cannot produce, so simple cross-site form submissions cannot reach this endpoint.
 */
export async function pairLocalCompanion(
  code: string,
): Promise<{ machineId: string; machineName: string } | null> {
  try {
    const response = await fetch(`${baseUrl()}/pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-devflow-pair": "1",
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
      signal: AbortSignal.timeout(PAIR_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return (await response.json()) as { machineId: string; machineName: string };
  } catch {
    return null;
  }
}

/**
 * DEV-ONLY DIAGNOSTIC. Proves the deployed static frontend can reach the
 * `career-health` Edge Function — nothing more. Not imported by any
 * customer-facing page or component; call it from the browser console
 * (`window.__careerHealthCheck()`, wired in development only — see
 * `src/components/CareerHealthProbe.tsx`) or from a future smoke test.
 *
 * Deliberately bypasses `src/lib/supabaseClient.ts`: this needs to work even
 * before Supabase Auth/session concerns exist, and a bare `fetch` against
 * the Functions URL is the smallest possible thing that can fail, which is
 * the point of a liveness probe.
 */
export type CareerHealthResult =
  | { ok: true; service: string }
  | { ok: false; error: string };

export async function checkCareerHealth(): Promise<CareerHealthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return { ok: false, error: "supabase_env_not_configured" };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/career-health`, {
      method: "GET",
      headers: { apikey: publishableKey },
    });
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}` };
    }
    const body = (await res.json()) as { ok?: boolean; service?: string };
    return body.ok
      ? { ok: true, service: body.service ?? "unknown" }
      : { ok: false, error: "unexpected_response" };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

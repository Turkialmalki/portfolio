"use client";

/**
 * TEMPORARY — Privacy Test K QA diagnostic.
 *
 * Exists ONLY to break a circular dependency: the normal /career upload
 * flow only ever shows the magic-link auth gate once a real analysis
 * attempt starts, and a real analysis attempt is itself gated behind the
 * hosted `career-health` privacy-gate check — so while
 * PRIVACY_SECURITY_EXECUTION_VERIFIED is false, no visitor (not even a
 * signed-in one) can ever reach the auth form through the real product
 * UI. This screen is a separate, isolated entry point — reachable only
 * at `/career?privacyTestK=1`, never linked from the real product — that
 * lets a human complete ONE authenticated diagnostic call against
 * `analyze-resume` so its hosted log output can be inspected for Privacy
 * Test K, without ever touching Storage, the parser, or the AI provider
 * (the server's own release-gate check in `analyze-resume/index.ts`
 * refuses the request before any of those run).
 *
 * DELETE THIS FILE (and its one import/render branch in CareerClient.tsx)
 * once PRIVACY_SECURITY_EXECUTION_VERIFIED flips to true — it has no
 * reason to exist afterward.
 *
 * Rules this component follows:
 *  - reuses the existing `supabase.auth.signInWithOtp` / `getSession`
 *    flow verbatim — no password auth, no new auth mechanism.
 *  - never reads, displays, or logs an access/refresh token — session
 *    state is only ever the boolean "signed in or not".
 *  - the diagnostic call is `mode: "customer"` with a placeholder
 *    resumeId; the server's gate check runs BEFORE it ever looks at
 *    that id, so no real or fake resume is ever touched.
 *  - only renders safe, already-public-shaped fields: a pass/fail, an
 *    HTTP status number, and a SafeErrorCode string (never raw response
 *    bodies/headers).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthState = "loading" | "signed_out" | "sent" | "signed_in";
type DiagState = { sent: boolean; status?: number; code?: string };

export default function CareerPrivacyTestK() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [email, setEmail] = useState("");
  const [diag, setDiag] = useState<DiagState | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthState("signed_out");
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setAuthState(data.session ? "signed_in" : "signed_out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "signed_in" : "signed_out");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submitEmail = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!supabase || !email) return;
      void supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/career?privacyTestK=1` : undefined,
        },
      });
      setAuthState("sent");
    },
    [email],
  );

  const runDiagnostic = useCallback(async () => {
    if (!supabase) return;
    setRunning(true);
    setDiag({ sent: true });
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { mode: "customer", resumeId: "00000000-0000-0000-0000-000000000000" },
      });
      // Mirrors the exact data-shape read in CareerClient's real analysis
      // path: the Edge Function always returns its SafeErrorCode in the
      // JSON body's `error` field, status carried separately by the SDK.
      const status = (error as { context?: { status?: number } } | null)?.context?.status;
      const code =
        data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : undefined;
      setDiag({ sent: true, status, code });
    } catch {
      setDiag({ sent: true });
    } finally {
      setRunning(false);
    }
  }, []);

  const gatePassed = diag?.status === 503 && diag?.code === "GATED";

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "80px auto",
        padding: "0 24px",
        fontFamily: "system-ui, sans-serif",
        color: "#e5e5e5",
        background: "#0a0a0a",
        minHeight: "60vh",
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>Privacy Test K — QA diagnostic</h1>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24 }}>
        Temporary. Not linked from the real product. Safe to bookmark, not to share.
      </p>

      <p style={{ fontSize: 14, marginBottom: 16 }}>
        AUTH SESSION: {authState === "loading" ? "…" : authState === "signed_in" ? "PASS" : "FAIL"}
      </p>

      {authState !== "signed_in" ? (
        authState === "sent" ? (
          <p style={{ fontSize: 14 }}>Check your email for the sign-in link, then return to this URL.</p>
        ) : (
          <form onSubmit={submitEmail} style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              style={{ flex: 1, padding: "8px 10px", background: "#161616", color: "#e5e5e5", border: "1px solid #333" }}
            />
            <button type="submit" style={{ padding: "8px 14px" }}>
              Continue
            </button>
          </form>
        )
      ) : (
        <>
          <button onClick={() => void runDiagnostic()} disabled={running} style={{ padding: "8px 14px", marginBottom: 20 }}>
            {running ? "Running…" : "Run Privacy Test K diagnostic"}
          </button>

          {diag && (
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              <p>DIAGNOSTIC REQUEST SENT: {diag.sent ? "YES" : "NO"}</p>
              <p>HTTP STATUS: {diag.status ?? "…"}</p>
              <p>ERROR CODE: {diag.code ?? "…"}</p>
              <p>
                EXPECTED GATED RESPONSE:{" "}
                {diag.status === undefined ? "…" : gatePassed ? "PASS" : "FAIL — inspect logs before proceeding"}
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

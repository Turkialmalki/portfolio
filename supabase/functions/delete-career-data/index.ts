/**
 * delete-career-data — the FOUNDATION for "Delete my Career data"
 * (Command 02 §8). Deletes/anonymizes every CAREER-CONTENT row a user owns
 * in one call: resumes + their analyses. Rewrite drafts, LinkedIn data, and
 * profile data are named in the brief as future scope — there is no code
 * for any of them yet, so there is nothing more for this function to touch
 * today; when they exist, they extend `delete_career_data()` in the
 * migration, not this Edge Function's shape.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT TOUCH ─────────────────────────────────
 * `purchases` and `entitlements` — FINANCIAL RECORDS, not career content.
 * See docs/career-privacy.md, "Career content vs. financial records", for
 * why: refund/dispute handling, accounting, and fraud prevention are
 * operational reasons a paid product keeps its payment ledger even after a
 * customer deletes their content. A user who wants their financial records
 * handled differently needs a distinct, human-reviewed request — not a
 * self-service button — which is out of scope here.
 *
 * Same auth pattern as delete-resume: a real Supabase session verified with
 * auth.getUser(), the verified user id (never the request body) passed into
 * the security-definer RPC, idempotent by construction (deleting an
 * already-fully-deleted account's data is just an empty result, not an
 * error).
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeError } from "../_shared/errorCodes.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "career-resumes";

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  const startedAt = Date.now();
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    const { status, body } = safeError("METHOD_NOT_ALLOWED");
    return jsonResponse(body, status, headers);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    const { status, body } = safeError("NOT_AUTHORIZED");
    return jsonResponse(body, status, headers);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    const { status, body } = safeError("NOT_AUTHORIZED");
    return jsonResponse(body, status, headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin.rpc("delete_career_data", {
    p_user_id: user.id, // from the verified session — never from the request body
  });

  if (error) {
    safeLogError({
      event: "delete_career_data_failed",
      user_id: user.id,
      error_code: "INTERNAL_ERROR",
      duration_ms: Date.now() - startedAt,
    });
    const { status, body } = safeError("INTERNAL_ERROR");
    return jsonResponse(body, status, headers);
  }

  const rows = (data ?? []) as { resume_id: string; storage_path: string }[];
  if (rows.length > 0) {
    const { error: storageError } = await admin.storage.from(BUCKET).remove(
      rows.map((r) => r.storage_path),
    );
    if (storageError) {
      safeLogError({
        event: "delete_career_data_storage_cleanup_failed",
        user_id: user.id,
        error_code: "UPLOAD_FAILED",
        duration_ms: Date.now() - startedAt,
      });
    }
  }

  safeLog({
    event: "delete_career_data_succeeded",
    user_id: user.id,
    duration_ms: Date.now() - startedAt,
  });

  return jsonResponse({ ok: true, resumes_deleted: rows.length }, 200, headers);
});

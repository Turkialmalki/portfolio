/**
 * delete-resume — the ONLY way a resume gets deleted (Command 02 §7).
 *
 * ── AUTH, TWICE ───────────────────────────────────────────────────────────
 * Same pattern as `request-payment-verification` (01C): the caller's
 * Supabase session is verified with `auth.getUser()` against the anon-key
 * client, and the user id THAT VERIFIED, never anything the request body
 * claims, is what gets passed to Postgres. Ownership is checked a SECOND
 * time, independently, inside `delete_resume()` in the Command 02 migration
 * — so a bug in this function's own logic alone could not let User A delete
 * User B's resume.
 *
 * ── WHAT "DELETE" MEANS HERE ─────────────────────────────────────────────
 * 1. The Storage object is removed immediately — not on a timer, not
 *    soft-deleted; `storage.remove()` is a real, permanent byte removal.
 * 2. The `resumes` row (and its `resume_analyses` rows) are soft-deleted
 *    (`deleted_at` set) so `deletion_audit` and idempotent repeat calls are
 *    possible. Nothing purges the row itself yet — see
 *    `supabase/functions/_shared/retention.ts` for the configured-but-not-
 *    yet-scheduled purge window.
 * 3. A `deletion_audit` row records that this happened.
 *
 * ── IDEMPOTENCY ───────────────────────────────────────────────────────────
 * Calling this twice for the same resume is always a 200, never a 409/500:
 * the second call finds `deleted_at` already set, skips the DB writes, and
 * just retries the (harmless, already-a-no-op-if-missing) Storage removal.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeError, classifyRpcError } from "../_shared/errorCodes.ts";
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

  let requestBody: { resume_id?: string };
  try {
    requestBody = await req.json();
  } catch {
    const { status, body } = safeError("INVALID_REQUEST");
    return jsonResponse(body, status, headers);
  }
  if (!requestBody.resume_id) {
    const { status, body } = safeError("INVALID_REQUEST");
    return jsonResponse(body, status, headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin
    .rpc("delete_resume", {
      p_resume_id: requestBody.resume_id,
      p_user_id: user.id, // from the verified session — never from the request body
    })
    .maybeSingle();

  if (error) {
    const code = classifyRpcError(error.message);
    safeLogError({
      event: "delete_resume_failed",
      resume_id: requestBody.resume_id,
      user_id: user.id,
      error_code: code,
      duration_ms: Date.now() - startedAt,
    });
    const { status, body } = safeError(code);
    return jsonResponse(body, status, headers);
  }

  // Real byte removal, every call (idempotent by nature — removing an
  // already-removed or never-existing object is not an error from Storage).
  const { error: storageError } = await admin.storage.from(BUCKET).remove([data!.storage_path]);
  if (storageError) {
    // The DB side is already soft-deleted at this point — do not fail the
    // whole request over a Storage cleanup hiccup; log it so it can be
    // reconciled, and let the client treat this as success. A retried call
    // will attempt the Storage removal again.
    safeLogError({
      event: "delete_resume_storage_cleanup_failed",
      resume_id: requestBody.resume_id,
      user_id: user.id,
      error_code: "UPLOAD_FAILED",
      duration_ms: Date.now() - startedAt,
    });
  }

  safeLog({
    event: "delete_resume_succeeded",
    resume_id: requestBody.resume_id,
    user_id: user.id,
    duration_ms: Date.now() - startedAt,
  });

  return jsonResponse({ ok: true, already_deleted: data!.already_deleted }, 200, headers);
});

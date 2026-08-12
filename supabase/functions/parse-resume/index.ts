/**
 * parse-resume — the trusted server-side entry point for the resume
 * parser (Command 05B §2, §7, §29).
 *
 * REAL CUSTOMER MODE IS BLOCKED, same as analyze-resume. There is no
 * `resumeId`-based code path in this file at all — the conceptual
 * production shape is:
 *
 *   { resumeId }
 *     → authenticate caller
 *     → load resumes row, verify user_id = auth.uid()
 *     → read the private `career-resumes` Storage object at its
 *       storage_path
 *     → parseResumeFile(bytes, ...)
 *
 * and building it is explicitly future work (§21), gated on the same
 * `PRIVACY_SECURITY_EXECUTION_VERIFIED` flag analyze-resume already
 * respects — see releaseGates.ts. Until a human flips that gate, this
 * function accepts exactly one thing: an admin-key-gated fixture_test
 * request naming one of the two bundled synthetic fixtures
 * (fixtures.ts). There is no `url` field anywhere in this file, and
 * there must never be one — that would be exactly the SSRF/arbitrary-
 * ingestion surface §6/§25 rule out.
 *
 * Auth model: identical to analyze-resume — an `x-admin-key` header
 * checked with a timing-safe comparison against the `ADMIN_API_KEY`
 * secret. No browser-reachable auth path exists here.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { safeError, type SafeErrorCode } from "../_shared/errorCodes.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { PRIVACY_SECURITY_EXECUTION_VERIFIED } from "../_shared/releaseGates.ts";
import { parseResumeFile } from "../_shared/parser/index.ts";
import { BUNDLED_FIXTURES } from "./fixtures.ts";

const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY");

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function respondError(code: SafeErrorCode, headers: HeadersInit) {
  const { status, body } = safeError(code);
  return jsonResponse(body, status, headers);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  const requestId = crypto.randomUUID();
  const start = Date.now();

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return respondError("METHOD_NOT_ALLOWED", headers);

  // §29: no real-customer path exists yet — every call must be an
  // explicit, credentialed fixture-test invocation.
  const providedKey = req.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || !providedKey || !timingSafeEqual(providedKey, ADMIN_API_KEY)) {
    return respondError("NOT_AUTHORIZED", headers);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respondError("INVALID_REQUEST", headers);
  }

  const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  if (bodyRecord.mode !== "fixture_test") {
    safeLog({ event: "parse_resume_rejected_non_fixture_mode", request_id: requestId });
    return respondError("INVALID_REQUEST", headers);
  }

  // Deliberately an ALLOWLIST lookup by key, never a filesystem/storage
  // path and never a URL — the only two "files" this function can ever
  // read are the ones bundled into fixtures.ts (§7, §25).
  const fixtureName = bodyRecord.fixtureName;
  if (typeof fixtureName !== "string" || !(fixtureName in BUNDLED_FIXTURES)) {
    safeLog({ event: "parse_resume_unknown_fixture", request_id: requestId });
    return jsonResponse(
      { error: "INVALID_REQUEST", message: "The request was invalid.", knownFixtures: Object.keys(BUNDLED_FIXTURES) },
      400,
      headers,
    );
  }

  const fixture = BUNDLED_FIXTURES[fixtureName];
  const bytes = base64ToBytes(fixture.base64);

  try {
    const result = await parseResumeFile({ bytes, declaredFilename: fixture.filename, declaredMimeType: fixture.mimeType });
    const duration_ms = Date.now() - start;

    if (!result.ok) {
      safeLogError({ event: "parse_resume_failed", request_id: requestId, error_code: result.code, duration_ms });
      return respondError(result.code, headers);
    }

    safeLog({
      event: "parse_resume_completed",
      request_id: requestId,
      duration_ms,
      status: 200,
      parser_version: result.resume.parserVersion,
      format: result.resume.sourceFormat,
      character_count: result.resume.characterCount,
      warning_codes: result.resume.warnings,
    });
    return jsonResponse(
      {
        ok: true,
        mode: "fixture_test",
        privacyGateVerified: PRIVACY_SECURITY_EXECUTION_VERIFIED,
        resume: result.resume,
      },
      200,
      headers,
    );
  } catch {
    safeLogError({ event: "parse_resume_unexpected_error", request_id: requestId, error_code: "PARSE_FAILED", duration_ms: Date.now() - start });
    return respondError("PARSE_FAILED", headers);
  }
});

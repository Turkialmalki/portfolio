/**
 * send-career-report — Career V2 Parts 15-18: a REAL server-side send of
 * the free (or, when entitled, a secure link to the) report to the
 * customer's own inbox via Resend. No mailto, no fake success.
 *
 * ── AUTH + OWNERSHIP (required) ───────────────────────────────────────────
 * Session-authenticated (`Authorization: Bearer <access_token>`), never an
 * admin key. The analysis is read through the CALLER's own RLS-scoped
 * client (`resume_analyses_select_own`) — the same double-enforced
 * ownership pattern every other Career function uses; a foreign
 * analysisId selects zero rows here structurally, never a 403 that
 * confirms it exists for someone else.
 *
 * ── DESTINATION VALIDATION (Part 16 — security over convenience) ─────────
 * This implementation restricts delivery to the AUTHENTICATED ACCOUNT'S
 * OWN email (`user.email`, already verified by Supabase Auth at sign-in) —
 * the simpler of the two options Part 16 offers, chosen over building a
 * separate unverified-address verification flow. A request naming any
 * other address is rejected outright; nothing here ever sends a private
 * CV report to an address that hasn't been verified as this user's own.
 *
 * ── DUPLICATE-SUBMIT GUARD ─────────────────────────────────────────────────
 * `career_report_email_log` (migration 20260812600002) gives this a
 * persistence-backed guard — edge functions are stateless/scale-to-zero,
 * so an in-memory debounce would not survive a second invocation. A
 * pending/sent row for the same analysis within the last 60s short-
 * circuits a resubmit with a friendly "already sending" response instead
 * of a second send.
 *
 * ── CONTENT (Part 17) ──────────────────────────────────────────────────────
 * FREE users: CV Strength score, ATS Compatibility, top 3 issues, top
 * strengths, the quick win, a deep link back to the report, and the $5
 * Full Review CTA. NO paid recommendations. ENTITLED users: a secure deep
 * link back to the Full Review (session/RLS required to open it) instead
 * of the entire sensitive report inlined in an email body.
 *
 * ── PROVIDER (Resend, server-side only) ────────────────────────────────────
 * `sendViaProvider()` calls Resend's HTTP API directly with `fetch` — no
 * SDK dependency, matching this repo's existing Deno-runtime discipline
 * (see anthropicProvider.ts's header). `RESEND_API_KEY`,
 * `CAREER_REPORT_FROM_EMAIL`, and the optional `CAREER_REPORT_REPLY_TO`
 * are Edge Function secrets read only here — never exposed to the client,
 * never logged (see safeLog.ts's allowlist below). The browser only ever
 * sees `{ ok: true }` or a safe `{ error: SafeErrorCode, message }` —
 * never Resend's raw response body, which can include the destination
 * address it was rejecting.
 *
 * ── SAFE LOGGING (Part 30) ─────────────────────────────────────────────────
 * Only request id, analysis id, status, and duration are ever logged —
 * never the destination email, CV text, report prose, or an access token.
 * `career_report_email_log`'s own columns structurally cannot hold any of
 * those (see the migration's header comment).
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { safeError, type SafeErrorCode } from "../_shared/errorCodes.ts";
import { safeLog, safeLogError } from "../_shared/safeLog.ts";
import { buildUiFreeReport, looksLikeCareerAnalysis } from "../_shared/analysis/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// No shared SITE_URL constant exists yet elsewhere in _shared/ (only an
// origin allowlist in cors.ts) — matches the literal origin that allowlist
// already trusts.
const SITE_URL = "https://www.turkialmalki.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DUPLICATE_WINDOW_MS = 60_000;
const RESEND_TIMEOUT_MS = 10_000;

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
function respondError(code: Parameters<typeof safeError>[0], headers: HeadersInit) {
  const { status, body } = safeError(code);
  return jsonResponse(body, status, headers);
}

interface ReportEmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Minimal HTML-escaping for AI-generated summary/action strings interpolated into the email body — these are prose, not markup, and must never be able to inject a tag. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ATS_DISCLAIMER = {
  ar: "التوافق مع ATS هو تقدير لقابلية قراءة وتنظيم السيرة وفق أنماط شائعة في أنظمة التوظيف، وليس ضماناً للقبول أو الرفض لدى شركة معينة.",
  en: "ATS Compatibility is an estimate of how readable and well-organized your CV is against common patterns used by hiring systems — not a guarantee of acceptance or rejection by any specific company.",
};

/**
 * Composes the email deterministically from data already computed —
 * nothing here calls Anthropic again. `entitled` decides between the free
 * summary (top issues/strengths/quick win + the $5 CTA) and the "your
 * full report is ready" link-only variant (Part 17 §3/§6): the full paid
 * report is never inlined here, only a secure deep link back to
 * `/career?analysis=<id>`, which remains gated by auth + RLS + entitlement
 * on the way in.
 */
function composeReportEmail(params: {
  lang: "ar" | "en";
  report: ReturnType<typeof buildUiFreeReport>;
  analysisId: string;
  entitled: boolean;
}): ReportEmailContent {
  const { lang, report, analysisId, entitled } = params;
  const reportUrl = `${SITE_URL}/career?analysis=${analysisId}`;
  const ar = lang === "ar";
  const dir = ar ? "rtl" : "ltr";

  const subject = ar ? "تقرير سيرتك الذاتية — Career by Turki" : "Your CV Report — Career by Turki";
  const scoreBandLabel = ar ? report.scoreBand.labelAr : report.scoreBand.labelEn;
  const atsScore = Math.round(report.atsCompatibility.atsCompatibilityScore);

  const issueLines = report.topIssues.map((i) => i.summary);
  const strengthLines = report.topStrengths.map((s) => s.summary);
  const quickWinLine = report.quickWin?.action ?? null;

  const textLines: string[] = [
    ar ? "تقييم سيرتك الذاتية" : "Your CV Review",
    `${report.overallScore} / 100 — ${ar ? "درجة قوة السيرة" : "CV Strength Score"} (${scoreBandLabel})`,
    "",
    ar ? "توافق ATS:" : "ATS Compatibility:",
    `${atsScore} / 100`,
    "",
    ar ? "أهم النقاط التي تحتاج تحسين:" : "Top issues to improve:",
    ...issueLines.map((s) => `- ${s}`),
    "",
    ar ? "أقوى نقاط السيرة:" : "Your CV's strongest points:",
    ...strengthLines.map((s) => `- ${s}`),
  ];
  if (quickWinLine) {
    textLines.push("", ar ? "ابدأ بهذه الخطوة:" : "Start with this:", quickWinLine);
  }
  textLines.push("");

  if (entitled) {
    textLines.push(
      ar ? "تقريرك الكامل جاهز." : "Your Full Review is ready.",
      "",
      ar ? "افتح المراجعة الكاملة:" : "Open your Full Review:",
      reportUrl,
    );
  } else {
    textLines.push(
      ar ? "باقي التقرير" : "The rest of your report",
      ar
        ? `${report.fullReviewCounts.recommendations} توصية تفصيلية`
        : `${report.fullReviewCounts.recommendations} detailed recommendations`,
      ar
        ? `${report.fullReviewCounts.highPriority} تغييرات عالية الأولوية`
        : `${report.fullReviewCounts.highPriority} high-priority changes`,
      ar ? "تحسينات ATS" : "ATS improvements",
      ar ? "خطة عمل مرتبة بالأولوية" : "A prioritized action plan",
      "",
      ar ? "افتح تقريرك:" : "Open your report:",
      reportUrl,
      "",
      ar ? "افتح المراجعة الكاملة بـ $5:" : "Unlock the Full Review — $5:",
      reportUrl,
    );
  }
  textLines.push("", ATS_DISCLAIMER[lang]);

  const issuesHtml = issueLines.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const strengthsHtml = strengthLines.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const quickWinHtml = quickWinLine
    ? `<p style="margin:0 0 4px;font-weight:600;">${ar ? "ابدأ بهذه الخطوة:" : "Start with this:"}</p><p style="margin:0 0 24px;">${escapeHtml(quickWinLine)}</p>`
    : "";

  const closingHtml = entitled
    ? `
      <p style="margin:0 0 16px;font-weight:600;">${ar ? "تقريرك الكامل جاهز." : "Your Full Review is ready."}</p>
      <p style="margin:0 0 24px;"><a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">${ar ? "افتح المراجعة الكاملة" : "Open your Full Review"}</a></p>
    `
    : `
      <p style="margin:0 0 8px;font-weight:600;">${ar ? "باقي التقرير" : "The rest of your report"}</p>
      <ul style="margin:0 0 24px;padding-${ar ? "right" : "left"}:20px;">
        <li>${ar ? `${report.fullReviewCounts.recommendations} توصية تفصيلية` : `${report.fullReviewCounts.recommendations} detailed recommendations`}</li>
        <li>${ar ? `${report.fullReviewCounts.highPriority} تغييرات عالية الأولوية` : `${report.fullReviewCounts.highPriority} high-priority changes`}</li>
        <li>${ar ? "تحسينات ATS" : "ATS improvements"}</li>
        <li>${ar ? "خطة عمل مرتبة بالأولوية" : "A prioritized action plan"}</li>
      </ul>
      <p style="margin:0 0 12px;"><a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">${ar ? "افتح تقريرك" : "Open your report"}</a></p>
      <p style="margin:0 0 24px;"><a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background:#0a7d3a;color:#fff;text-decoration:none;border-radius:8px;">${ar ? "افتح المراجعة الكاملة بـ $5" : "Unlock the Full Review — $5"}</a></p>
    `;

  const html = `
<!doctype html>
<html dir="${dir}" lang="${lang}">
  <body style="margin:0;padding:0;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;color:#111;">
    <div dir="${dir}" style="max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
      <h1 style="font-size:20px;margin:0 0 4px;">${ar ? "تقييم سيرتك الذاتية" : "Your CV Review"}</h1>
      <p style="font-size:36px;font-weight:700;margin:8px 0 0;" dir="ltr">${report.overallScore} <span style="font-size:16px;font-weight:400;color:#666;">/ 100</span></p>
      <p style="margin:0 0 20px;color:#666;">${ar ? "درجة قوة السيرة" : "CV Strength Score"} — ${escapeHtml(scoreBandLabel)}</p>

      <p style="margin:0 0 4px;font-weight:600;">${ar ? "توافق ATS:" : "ATS Compatibility:"}</p>
      <p style="margin:0 0 24px;" dir="ltr">${atsScore} / 100</p>

      <p style="margin:0 0 8px;font-weight:600;">${ar ? "أهم النقاط التي تحتاج تحسين:" : "Top issues to improve:"}</p>
      <ul style="margin:0 0 20px;padding-${ar ? "right" : "left"}:20px;">${issuesHtml}</ul>

      <p style="margin:0 0 8px;font-weight:600;">${ar ? "أقوى نقاط السيرة:" : "Your CV's strongest points:"}</p>
      <ul style="margin:0 0 20px;padding-${ar ? "right" : "left"}:20px;">${strengthsHtml}</ul>

      ${quickWinHtml}
      ${closingHtml}

      <p style="margin:24px 0 0;font-size:12px;color:#888;line-height:1.5;">${ATS_DISCLAIMER[lang]}</p>
    </div>
  </body>
</html>`.trim();

  return { subject, html, text: textLines.join("\n") };
}

type SendOutcome = { ok: true } | { ok: false; code: Extract<SafeErrorCode, `EMAIL_${string}`> };

/**
 * Sends via Resend's HTTP API directly (`fetch`, no SDK — see file header).
 * Every failure path is classified into one of the safe email codes below;
 * the raw Resend response body (which can include the rejected destination
 * address) is read only for status classification and is never logged or
 * returned to the caller.
 */
async function sendViaProvider(destinationEmail: string, content: ReportEmailContent): Promise<SendOutcome> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("CAREER_REPORT_FROM_EMAIL");
  if (!apiKey || !from) return { ok: false, code: "EMAIL_NOT_CONFIGURED" };
  const replyTo = Deno.env.get("CAREER_REPORT_REPLY_TO");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [destinationEmail],
        subject: content.subject,
        html: content.html,
        text: content.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: false, code: "EMAIL_RATE_LIMITED" };
    if (res.status >= 500) return { ok: false, code: "EMAIL_PROVIDER_UNAVAILABLE" };
    return { ok: false, code: "EMAIL_SEND_FAILED" };
  } catch {
    // Network failure, DNS failure, or the abort() above firing on timeout.
    return { ok: false, code: "EMAIL_PROVIDER_UNAVAILABLE" };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  const requestId = crypto.randomUUID();
  const start = Date.now();

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return respondError("METHOD_NOT_ALLOWED", headers);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return respondError("NOT_AUTHORIZED", headers);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return respondError("NOT_AUTHORIZED", headers);

  let body: { analysisId?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return respondError("INVALID_REQUEST", headers);
  }
  const analysisId = body.analysisId;
  if (typeof analysisId !== "string" || !UUID_RE.test(analysisId)) {
    return respondError("INVALID_REQUEST", headers);
  }

  // Part 16: destination is ALWAYS the authenticated account's own
  // verified email. A caller supplying a different `email` is rejected —
  // never silently redirected to the account email, so the client can
  // surface an honest "we can only send to your account email" message
  // rather than a report that quietly went somewhere the caller didn't
  // expect.
  if (!user.email) {
    return respondError("NOT_AUTHORIZED", headers);
  }
  if (typeof body.email === "string" && body.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    return respondError("NOT_AUTHORIZED", headers);
  }

  // Ownership: RLS-scoped to the caller, same pattern as get-analysis-report.
  const { data: row, error: rowError } = await userClient
    .from("resume_analyses")
    .select("id, resume_id, result_json, status")
    .eq("id", analysisId)
    .eq("status", "complete")
    .maybeSingle();
  if (rowError) {
    safeLogError({ event: "send_career_report_lookup_failed", request_id: requestId, user_id: user.id, error_code: "INTERNAL_ERROR" });
    return respondError("INTERNAL_ERROR", headers);
  }
  if (!row || !looksLikeCareerAnalysis(row.result_json)) {
    return respondError("NOT_FOUND", headers);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Duplicate-submit guard (persistence-backed — see file header).
  const { data: recent } = await admin
    .from("career_report_email_log")
    .select("id, status, created_at")
    .eq("analysis_id", analysisId)
    .eq("user_id", user.id)
    .in("status", ["pending", "sent"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && Date.now() - new Date(recent.created_at as string).getTime() < DUPLICATE_WINDOW_MS) {
    safeLog({ event: "send_career_report_duplicate_suppressed", request_id: requestId, user_id: user.id, analysis_id: analysisId });
    return jsonResponse({ ok: true, status: recent.status === "sent" ? "sent" : "pending" }, 200, headers);
  }

  const { data: logRow, error: logInsertError } = await admin
    .from("career_report_email_log")
    .insert({ request_id: requestId, user_id: user.id, analysis_id: analysisId, destination_class: "own_account", status: "pending" })
    .select("id")
    .single();
  if (logInsertError || !logRow) {
    safeLogError({ event: "send_career_report_log_insert_failed", request_id: requestId, user_id: user.id, error_code: "INTERNAL_ERROR" });
    return respondError("INTERNAL_ERROR", headers);
  }

  // Entitlement (Part 17: entitled users get a secure link, not the whole report inlined).
  const { data: entitlement } = await userClient
    .from("entitlements")
    .select("id")
    .eq("product_key", "career_cv_full_review")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const outputLanguage: "ar" | "en" = row.result_json.context.outputLanguage === "ar" ? "ar" : "en";
  const report = buildUiFreeReport(row.result_json, outputLanguage);
  const content = composeReportEmail({ lang: outputLanguage, report, analysisId, entitled: !!entitlement });

  const outcome = await sendViaProvider(user.email, content);
  const duration_ms = Date.now() - start;

  if (!outcome.ok) {
    await admin.from("career_report_email_log").update({ status: "failed", duration_ms }).eq("id", logRow.id);
    safeLogError({
      event: "send_career_report_send_failed",
      request_id: requestId,
      user_id: user.id,
      analysis_id: analysisId,
      error_code: outcome.code,
      duration_ms,
    });
    return respondError(outcome.code, headers);
  }

  await admin.from("career_report_email_log").update({ status: "sent", duration_ms }).eq("id", logRow.id);
  safeLog({ event: "send_career_report_sent", request_id: requestId, user_id: user.id, analysis_id: analysisId, duration_ms });
  return jsonResponse({ ok: true, status: "sent" }, 200, headers);
});

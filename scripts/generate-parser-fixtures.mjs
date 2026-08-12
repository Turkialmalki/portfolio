#!/usr/bin/env node
/**
 * SYNTHETIC PARSER FIXTURES (Command 05B §26).
 *
 * Hand-builds minimal, valid PDF and DOCX files byte-for-byte — no
 * external authoring tool, no real CV, no customer data. Every named
 * person/email/phone in these fixtures is fictional (Command 05B's own
 * example: "Test User Alpha", alpha@example.test, +966500000001) and nn
 * fixture may ever be swapped for real content.
 *
 * Regenerate with: node scripts/generate-parser-fixtures.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "supabase", "tests", "parser", "fixtures");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── minimal PDF object/file assembly ────────────────────────────────────

function buildPdfFile(bodies) {
  // bodies: array of { dict: string, stream?: string|Buffer } — object N is bodies[N-1].
  let out = Buffer.from("%PDF-1.4\n", "latin1");
  const offsets = [0];
  for (let i = 0; i < bodies.length; i++) {
    offsets.push(out.length);
    const num = i + 1;
    const b = bodies[i];
    if (b.stream === undefined) {
      out = Buffer.concat([out, Buffer.from(`${num} 0 obj\n${b.dict}\nendobj\n`, "latin1")]);
    } else {
      const streamBuf = Buffer.isBuffer(b.stream) ? b.stream : Buffer.from(b.stream, "latin1");
      out = Buffer.concat([
        out,
        Buffer.from(`${num} 0 obj\n<< ${b.dict} /Length ${streamBuf.length} >>\nstream\n`, "latin1"),
        streamBuf,
        Buffer.from("\nendstream\nendobj\n", "latin1"),
      ]);
    }
  }
  const xrefStart = out.length;
  let xref = `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= bodies.length; i++) xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  out = Buffer.concat([out, Buffer.from(xref, "latin1")]);
  out = Buffer.concat([out, Buffer.from(`trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`, "latin1")]);
  return out;
}

function escapePdfLiteral(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** English-only content stream: one line per array entry, top-down, Helvetica. */
function latinContentStream(lines, { startY = 740, x = 72, leading = 16, fontSize = 11 } = {}) {
  let s = `BT /F1 ${fontSize} Tf ${x} ${startY} Td ${leading} TL\n`;
  lines.forEach((line, i) => {
    if (i > 0) s += `T*\n`;
    s += `(${escapePdfLiteral(line)}) Tj\n`;
  });
  s += "ET";
  return s;
}

function arabicFontObjects(startNum) {
  // A Type0/Identity-H font with a ToUnicode CMap mapping CID==codepoint.
  // No embedded glyph program — sufficient for text-layer extraction
  // (verified against this exact construction during development), not
  // for visual rendering.
  const CODEPOINT_MAX = 0x0900; // covers Arabic block + presentation forms range used by these fixtures
  let bfrange = `<0000> <${CODEPOINT_MAX.toString(16).padStart(4, "0")}> <0000>`;
  const toUnicode = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n${bfrange}\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
  const toUnicodeNum = startNum;
  const fontDescriptorNum = startNum + 1;
  const descendantNum = startNum + 2;
  const type0Num = startNum + 3;
  return {
    numbersUsed: 4,
    type0Num,
    bodies: [
      { dict: "", stream: toUnicode }, // toUnicodeNum
      {
        dict: `<< /Type /FontDescriptor /FontName /ArabicTest /Flags 4 /FontBBox [0 0 1000 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 >>`,
      }, // fontDescriptorNum
      {
        dict: `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ArabicTest /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fontDescriptorNum} 0 R /DW 1000 /CIDToGIDMap /Identity >>`,
      }, // descendantNum
      {
        dict: `<< /Type /Font /Subtype /Type0 /BaseFont /ArabicTest /Encoding /Identity-H /DescendantFonts [${descendantNum} 0 R] /ToUnicode ${toUnicodeNum} 0 R >>`,
      }, // type0Num
    ],
  };
}

function toHexCids(text) {
  return Array.from(text)
    .map((ch) => ch.codePointAt(0).toString(16).padStart(4, "0"))
    .join("");
}

/** Arabic-only content stream, one logical line per array entry, referencing the Type0 font as /F2. */
function arabicContentStream(lines, { startY = 740, x = 40, leading = 16, fontSize = 10 } = {}) {
  // NOTE: this Type0/Identity-H font has no real glyph-width table (no
  // embedded font program — see arabicFontObjects), so every CID advances
  // by the flat /DW default width regardless of what character it is.
  // Text-layer extraction (this parser's only concern) doesn't care, but
  // PDF.js DOES drop glyphs that land outside the page's MediaBox — so
  // `x` has to be small and `fontSize` conservative enough that even the
  // longest fixture line's flat-width advance stays on the page (verified
  // during development: a right-aligned start x clipped every line after
  // a handful of characters).
  let s = `BT /F2 ${fontSize} Tf ${x} ${startY} Td ${leading} TL\n`;
  lines.forEach((line, i) => {
    if (i > 0) s += `T*\n`;
    s += `<${toHexCids(line)}> Tj\n`;
  });
  s += "ET";
  return s;
}

function pageDict({ parentNum, contentsNum, fontRefs, mediaBox = "[0 0 612 792]", extraResources = "" }) {
  return `<< /Type /Page /Parent ${parentNum} 0 R /MediaBox ${mediaBox} /Resources << /Font << ${fontRefs} >> ${extraResources} >> /Contents ${contentsNum} 0 R >>`;
}

// ── fixture 1: normal English PDF ───────────────────────────────────────
function buildNormalEnglishPdf() {
  const content = latinContentStream([
    "Test User Alpha",
    "alpha@example.test | +1 555 010 0100",
    "",
    "Summary",
    "Backend engineer with a track record of owning reliability end-to-end.",
    "",
    "Experience",
    "Senior Backend Engineer - Fictional Payments Inc | 2022 - Present",
    "- Led the redesign of the settlement pipeline, reducing failed transactions by 18%.",
    "- Mentored two engineers into the on-call rotation.",
    "",
    "Education",
    "BSc Computer Science, Fictional Institute of Technology, 2019",
    "",
    "Skills",
    "Go, Kubernetes, PostgreSQL, distributed systems",
  ]);
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" }, // 1
    { dict: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" }, // 2
    { dict: pageDict({ parentNum: 2, contentsNum: 4, fontRefs: "/F1 5 0 R" }) }, // 3
    { dict: "", stream: content }, // 4
    { dict: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" }, // 5
  ];
  return buildPdfFile(bodies);
}

// ── fixture 2: normal Arabic PDF ────────────────────────────────────────
function buildNormalArabicPdf() {
  const font = arabicFontObjects(5); // objects 5..8
  const content = arabicContentStream([
    "اسم المستخدم التجريبي",
    "الملخص المهني",
    "مهندس برمجيات خبرة في الأنظمة الموزعة",
    "الخبرة العملية",
    "مهندس أول - شركة تجريبية للمدفوعات",
    "قاد إعادة تصميم نظام التسوية للمعاملات",
    "قلل من المعاملات الفاشلة بشكل كبير",
    "المهارات",
    "بايثون، كوبرنيتيس، قواعد بيانات موزعة",
  ]);
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { dict: pageDict({ parentNum: 2, contentsNum: 4, fontRefs: `/F2 ${font.type0Num} 0 R` }) },
    { dict: "", stream: content },
    ...font.bodies,
  ];
  return buildPdfFile(bodies);
}

// ── fixture 3: bilingual PDF ─────────────────────────────────────────────
function buildBilingualPdf() {
  const font = arabicFontObjects(6); // objects 6..9, leaving 5 for Helvetica
  const latinPart = `BT /F1 11 Tf 72 740 Td 16 TL\n(Test User Alpha) Tj\nT*\n(Senior Backend Engineer - Fictional Payments Inc) Tj\nT*\n(Led the settlement pipeline redesign, cutting failures by 18%.) Tj\nET\n`;
  const arabicLines = ["اسم المستخدم التجريبي", "مهندس أول في شركة تجريبية للمدفوعات", "قاد إعادة تصميم نظام التسوية للمعاملات"];
  const arabicPart = `BT /F2 10 Tf 40 620 Td 16 TL\n${arabicLines.map((l, i) => `${i > 0 ? "T*\n" : ""}<${toHexCids(l)}> Tj`).join("\n")}\nET`;
  const content = latinPart + arabicPart;
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { dict: pageDict({ parentNum: 2, contentsNum: 4, fontRefs: `/F1 5 0 R /F2 ${font.type0Num} 0 R` }) },
    { dict: "", stream: content },
    { dict: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
    ...font.bodies,
  ];
  return buildPdfFile(bodies);
}

// ── fixture 4: multi-page PDF (3 pages, distinct content) ────────────────
function buildMultiPagePdf() {
  const pageLines = [
    ["Test User Alpha", "Page 1 — Summary", "Backend engineer with distributed systems experience."],
    ["Experience", "Senior Backend Engineer - Fictional Payments Inc", "- Led the settlement pipeline redesign."],
    ["Education", "BSc Computer Science, Fictional Institute of Technology, 2019", "Skills: Go, Kubernetes, PostgreSQL"],
  ];
  // objects: 1 catalog, 2 pages, 3-5 page objs, 6-8 content streams, 9 font
  const fontNum = 9;
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: `<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>` },
    { dict: pageDict({ parentNum: 2, contentsNum: 6, fontRefs: `/F1 ${fontNum} 0 R` }) },
    { dict: pageDict({ parentNum: 2, contentsNum: 7, fontRefs: `/F1 ${fontNum} 0 R` }) },
    { dict: pageDict({ parentNum: 2, contentsNum: 8, fontRefs: `/F1 ${fontNum} 0 R` }) },
    { dict: "", stream: latinContentStream(pageLines[0]) },
    { dict: "", stream: latinContentStream(pageLines[1]) },
    { dict: "", stream: latinContentStream(pageLines[2]) },
    { dict: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
  ];
  return buildPdfFile(bodies);
}

// ── fixture 13: repeated page header/footer ───────────────────────────────
function buildHeaderFooterRepeatPdf() {
  const header = "Test User Alpha";
  const footer = "Confidential - Fictional Fixture";
  const bodyLinesPerPage = [
    ["Experience", "- Led the settlement pipeline redesign, reducing failures by 18%."],
    ["Experience (continued)", "- Mentored two engineers into the on-call rotation."],
    ["Education", "BSc Computer Science, Fictional Institute of Technology, 2019"],
    ["Skills", "Go, Kubernetes, PostgreSQL, distributed systems"],
  ];
  const fontNum = 11;
  const pageObjNums = [3, 4, 5, 6];
  const contentObjNums = [7, 8, 9, 10];
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count 4 >>` },
    ...pageObjNums.map((n, i) => ({ dict: pageDict({ parentNum: 2, contentsNum: contentObjNums[i], fontRefs: `/F1 ${fontNum} 0 R` }) })),
    ...bodyLinesPerPage.map((lines) => ({ dict: "", stream: latinContentStream([header, ...lines, footer]) })),
    { dict: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
  ];
  return buildPdfFile(bodies);
}

// ── fixture 14: multi-column uncertainty ──────────────────────────────────
function buildMultiColumnPdf() {
  // Column A flows down normally; then an explicit upward Td jump starts
  // column B back near the top of the (unchanged) page — this is exactly
  // the pattern MULTI_COLUMN_ORDER_UNCERTAIN watches for (pdfExtract.ts: a
  // line-break whose y increases instead of decreasing mid-stream). The
  // jump stays within the page's MediaBox on purpose: PDF.js's text layer
  // drops glyphs positioned outside the page bounds entirely (confirmed
  // during development), so a jump large enough to leave the page would
  // silently lose "column B" instead of exercising the heuristic.
  const content = `BT /F1 11 Tf 72 740 Td 16 TL
(Test User Alpha - Fictional Fixture Candidate) Tj
T*
(Left column line two with some extra filler text) Tj
T*
(Left column line three with some extra filler text) Tj
T*
(Left column line four with some extra filler text) Tj
310 72 Td
(Right column line one with some extra filler text) Tj
T*
(Right column line two with some extra filler text) Tj
T*
(Right column line three with some extra filler text) Tj
ET`;
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { dict: pageDict({ parentNum: 2, contentsNum: 4, fontRefs: "/F1 5 0 R" }) },
    { dict: "", stream: content },
    { dict: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
  ];
  return buildPdfFile(bodies);
}

// ── fixture 11: image-only / scanned PDF (no text operators) ─────────────
function buildScannedPdf() {
  // A single 1x1 raw DeviceGray pixel — content only "paints" it, no Tj anywhere.
  const imageData = Buffer.from([0x80]);
  const content = `q 400 0 0 400 100 300 cm /Im1 Do Q`;
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { dict: pageDict({ parentNum: 2, contentsNum: 4, fontRefs: "", extraResources: "/XObject << /Im1 5 0 R >>" }) },
    { dict: "", stream: content },
    { dict: "/Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceGray /BitsPerComponent 8", stream: imageData },
  ];
  return buildPdfFile(bodies);
}

// ── fixture 10: corrupted PDF ─────────────────────────────────────────────
function buildCorruptedPdf() {
  // A real header, then bytes that are not valid PDF object syntax at all —
  // enough to make pdf.js's parser reject it outright rather than silently
  // returning an empty document. Padded past PARSER_LIMITS.minFileBytes so
  // this exercises FILE_CORRUPTED specifically, not the separate
  // too-small-to-be-useful INVALID_FILE path.
  const body = "this is not a real pdf object stream at all — no xref, no trailer, no objects.\n".repeat(4);
  return Buffer.from(`%PDF-1.4\n${body}%%EOF`, "latin1");
}

// ── fixture 9: fake PDF (wrong magic bytes entirely) ──────────────────────
function buildFakePdf() {
  return Buffer.from("This is a plain text file pretending to be a PDF resume.\n".repeat(10), "utf8");
}

// ── fixture 15: encrypted PDF stub ────────────────────────────────────────
function buildEncryptedPdfStub() {
  const content = latinContentStream(["Test User Alpha", "This document declares itself encrypted."]);
  const bodies = [
    { dict: "<< /Type /Catalog /Pages 2 0 R >>" },
    { dict: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { dict: pageDict({ parentNum: 2, contentsNum: 4, fontRefs: "/F1 5 0 R" }) },
    { dict: "", stream: content },
    { dict: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
    { dict: "<< /Filter /Standard /V 1 /R 2 /O <00> /U <00> /P -4 >>" }, // 6 — a stub /Encrypt dict, never resolved for real decryption
  ];
  const buf = buildPdfFile(bodies);
  // Splice a real /Encrypt reference into the trailer so the pre-parse scan finds it.
  const marker = "trailer\n<< ";
  const idx = buf.toString("latin1").indexOf(marker);
  const before = buf.subarray(0, idx + marker.length);
  const after = buf.subarray(idx + marker.length);
  return Buffer.concat([before, Buffer.from("/Encrypt 6 0 R ", "latin1"), after]);
}

// ── minimal DOCX (zip, stored/no compression) ─────────────────────────────

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  let offset = 0;
  const local = [];
  const central = [];
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf8");
    const crc = crc32(f.data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(f.data.length, 18);
    lh.writeUInt32LE(f.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    const localEntry = Buffer.concat([lh, nameBuf, f.data]);
    local.push(localEntry);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(f.data.length, 20);
    ch.writeUInt32LE(f.data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([ch, nameBuf]));
    offset += localEntry.length;
  }
  const centralBuf = Buffer.concat(central);
  const localBuf = Buffer.concat(local);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([localBuf, centralBuf, eocd]);
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`;
const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`;
const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function wPara(text, { heading = false, bullet = false } = {}) {
  const pPr = heading
    ? `<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>`
    : bullet
      ? `<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>`
      : "";
  return `<w:p>${pPr}<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}
function wTableRow(cells) {
  return `<w:tr>${cells.map((c) => `<w:tc><w:p><w:r><w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
}

function buildDocx(bodyParts, { withNumbering = true } = {}) {
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyParts.join("")}<w:sectPr/></w:body></w:document>`;
  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(CONTENT_TYPES, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(ROOT_RELS, "utf8") },
    { name: "word/document.xml", data: Buffer.from(document, "utf8") },
  ];
  if (withNumbering) {
    files.push({ name: "word/numbering.xml", data: Buffer.from(NUMBERING, "utf8") });
    files.push({ name: "word/_rels/document.xml.rels", data: Buffer.from(DOC_RELS, "utf8") });
  }
  return zipStore(files);
}

// ── fixture 5: normal English DOCX ────────────────────────────────────────
function buildNormalDocx() {
  return buildDocx([
    wPara("Test User Alpha"),
    wPara("alpha@example.test | +1 555 010 0100"),
    wPara("Summary", { heading: true }),
    wPara("Backend engineer with a track record of owning reliability end-to-end."),
    wPara("Experience", { heading: true }),
    wPara("Senior Backend Engineer - Fictional Payments Inc | 2022 - Present"),
    wPara("Led the redesign of the settlement pipeline, reducing failed transactions by 18%.", { bullet: true }),
    wPara("Mentored two engineers into the on-call rotation.", { bullet: true }),
    wPara("Education", { heading: true }),
    wPara("BSc Computer Science, Fictional Institute of Technology, 2019"),
    wPara("Skills", { heading: true }),
    wPara("Go, Kubernetes, PostgreSQL, distributed systems"),
  ]);
}

// ── fixture 6: DOCX with (moderate, non-dominant) table layout ───────────
function buildTableLayoutDocx() {
  const table = `<w:tbl>${wTableRow(["Phone", "+1 555 010 0100"])}${wTableRow(["Email", "alpha@example.test"])}</w:tbl>`;
  return buildDocx([
    wPara("Test User Alpha"),
    table,
    wPara("Summary", { heading: true }),
    wPara("Backend engineer with a track record of owning reliability end-to-end."),
    wPara("Experience", { heading: true }),
    wPara("Senior Backend Engineer - Fictional Payments Inc | 2022 - Present"),
    wPara("Led the redesign of the settlement pipeline, reducing failed transactions by 18%.", { bullet: true }),
    wPara("Education", { heading: true }),
    wPara("BSc Computer Science, Fictional Institute of Technology, 2019"),
  ]);
}

// ── bonus: table-dominant DOCX (exercises structureUncertain = true) ─────
function buildTableDominantDocx() {
  const rows = Array.from({ length: 12 }, (_, i) => wTableRow([`Skill ${i}`, `Level ${i}`, `Years of experience in area number ${i} of the skills matrix laid out entirely as a table`]));
  const table = `<w:tbl>${rows.join("")}</w:tbl>`;
  return buildDocx([wPara("Test User Alpha"), table]);
}

// ── fixture 7: weak/short CV ───────────────────────────────────────────────
function buildWeakShortDocx() {
  return buildDocx([wPara("Test User Beta"), wPara("Looking for a job.")], { withNumbering: false });
}

// ── fixture 3b: Arabic DOCX (bonus, exercises mammoth + Arabic together) ──
function buildArabicDocx() {
  return buildDocx(
    [wPara("اسم المستخدم التجريبي"), wPara("الملخص المهني", { heading: true }), wPara("مهندس برمجيات لديه خبرة في الأنظمة الموزعة")],
    { withNumbering: false },
  );
}

// ── main ───────────────────────────────────────────────────────────────
const files = {
  "pdf_normal_en.pdf": buildNormalEnglishPdf(),
  "pdf_normal_ar.pdf": buildNormalArabicPdf(),
  "pdf_bilingual.pdf": buildBilingualPdf(),
  "pdf_multipage.pdf": buildMultiPagePdf(),
  "docx_normal_en.docx": buildNormalDocx(),
  "docx_table_layout.docx": buildTableLayoutDocx(),
  "docx_table_dominant.docx": buildTableDominantDocx(),
  "docx_weak_short.docx": buildWeakShortDocx(),
  "docx_normal_ar.docx": buildArabicDocx(),
  "wrong_extension.pdf": buildNormalDocx(), // real docx bytes, .pdf extension — magic-byte/extension mismatch
  "fake.pdf": buildFakePdf(),
  "corrupted.pdf": buildCorruptedPdf(),
  "scanned_image_only.pdf": buildScannedPdf(),
  "pdf_header_footer_repeat.pdf": buildHeaderFooterRepeatPdf(),
  "pdf_multicolumn_uncertain.pdf": buildMultiColumnPdf(),
  "encrypted_stub.pdf": buildEncryptedPdfStub(),
};

for (const [name, data] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT_DIR, name), data);
}

// Oversized fixture generated separately (not committed — see README in the fixtures dir) to avoid an 8MB+ binary in git history.
console.log(`Wrote ${Object.keys(files).length} fixtures to ${OUT_DIR}`);

// ── bundled fixtures for the parse-resume Edge Function's fixture_test mode ─
// Same two synthetic fixtures, base64-embedded so the deployed function
// never reads outside its own directory (§7, §29 — no filesystem/storage
// path accepted from a caller).
const edgeFnFixturesPath = path.join(__dirname, "..", "supabase", "functions", "parse-resume", "fixtures.ts");
const pdfB64 = files["pdf_normal_en.pdf"].toString("base64");
const docxB64 = files["docx_normal_en.docx"].toString("base64");
const edgeFnFixturesSource = `/**
 * BUNDLED FIXTURES for the parse-resume Edge Function's fixture_test mode
 * (Command 05B §7, §29). These are the SAME synthetic, fictional-person
 * fixtures as supabase/tests/parser/fixtures/pdf_normal_en.pdf and
 * docx_normal_en.docx (base64-embedded here so the deployed function is
 * self-contained and never reads outside its own directory — no
 * filesystem/storage path is ever accepted from a caller). Regenerate
 * both together with: node scripts/generate-parser-fixtures.mjs
 */
export const BUNDLED_FIXTURES: Record<string, { base64: string; filename: string; mimeType: string }> = {
  pdf_normal_en: {
    base64: "${pdfB64}",
    filename: "pdf_normal_en.pdf",
    mimeType: "application/pdf",
  },
  docx_normal_en: {
    base64: "${docxB64}",
    filename: "docx_normal_en.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
};
`;
fs.writeFileSync(edgeFnFixturesPath, edgeFnFixturesSource);
console.log(`Wrote bundled Edge Function fixtures to ${edgeFnFixturesPath}`);

/**
 * SCORE BANDS (Command 03 §4).
 *
 * Consistent bands for the 0–100 overall score. Arabic labels are written
 * independently as professional Arabic — not translated English. All
 * labels describe the DOCUMENT, never the person: no "bad candidate", no
 * "unqualified", no insult anywhere in either language.
 */
export interface ScoreBand {
  min: number;
  max: number;
  labelEn: string;
  labelAr: string;
}

export const SCORE_BANDS: readonly ScoreBand[] = [
  {
    min: 90,
    max: 100,
    labelEn: "Excellent",
    labelAr: "ممتاز",
  },
  {
    min: 80,
    max: 89,
    labelEn: "Strong",
    labelAr: "قوي",
  },
  {
    min: 70,
    max: 79,
    labelEn: "Good, with meaningful improvements available",
    labelAr: "جيد، مع فرص تحسين واضحة",
  },
  {
    min: 60,
    max: 69,
    labelEn: "Needs improvement",
    labelAr: "بحاجة إلى تطوير",
  },
  {
    min: 45,
    max: 59,
    labelEn: "Weak positioning / significant issues",
    labelAr: "التموضع المهني في السيرة ضعيف ويحتاج إعادة صياغة",
  },
  {
    min: 0,
    max: 44,
    labelEn: "Major structural and content problems",
    labelAr: "السيرة الذاتية تحتاج إعادة بناء جوهرية في الهيكل والمحتوى",
  },
] as const;

export function bandForScore(score: number): ScoreBand {
  const clamped = Math.max(0, Math.min(100, score));
  // Bands are ordered high→low and cover 0–100 with no gaps, so this
  // always finds one.
  return SCORE_BANDS.find((b) => clamped >= b.min && clamped <= b.max)!;
}

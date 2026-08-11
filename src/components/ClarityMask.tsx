/**
 * Defense-in-depth for Command 02 §17, for content that ends up rendered
 * on a route NOT in `CLARITY_EXCLUDED_PATH_PREFIXES` (or on a page that
 * mixes sensitive and non-sensitive sections). `data-clarity-mask="true"`
 * is Microsoft Clarity's own documented attribute: text and images inside
 * a masked subtree are replaced with placeholders in recordings and
 * heatmaps, independent of the route-level stop/start logic in
 * `Analytics.tsx`. Not used anywhere yet — no Career UI exists in this
 * command — but ready for the first component that renders resume content
 * outside a fully-excluded route.
 */
export default function ClarityMask({ children }: { children: React.ReactNode }) {
  return <div data-clarity-mask="true">{children}</div>;
}

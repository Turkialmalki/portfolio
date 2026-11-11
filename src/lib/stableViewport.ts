/**
 * A viewport height that holds still while the browser's toolbar moves.
 *
 * On a phone the toolbar slides in and out as the reader scrolls — most of all
 * when scrolling back up — and Chrome on iOS reports that as a stream of
 * `resize` events with a changing height. Everything on this page that reads
 * the viewport (the pinned hero, the scroll trackers, the timeline) re-measures
 * on each one, which is what stalled the page.
 *
 * Two things, touch devices only:
 *  - `--svh` is one hundredth of the viewport height at load (and again when
 *    the width changes, i.e. a rotation). Layout uses it in place of `svh`.
 *  - a resize that changed only the height is swallowed before any other
 *    listener sees it.
 *
 * Imported for its side effect, first, so its listener is registered before
 * anyone else's.
 */
if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
  const root = document.documentElement;
  let width = window.innerWidth;
  const set = () => root.style.setProperty("--svh", `${window.innerHeight / 100}px`);
  set();
  window.addEventListener(
    "resize",
    (event) => {
      if (window.innerWidth === width) {
        event.stopImmediatePropagation();
        return;
      }
      width = window.innerWidth;
      set();
    },
    true,
  );
}

export {};

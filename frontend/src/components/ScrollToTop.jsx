import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Top of the page content, aligned below the sticky site header. Used for
// paginated query changes so the article list/heading comes into view instead
// of the very top of the document.
function contentTop() {
  const main = document.querySelector("main");
  if (!main) return 0;
  const headerHeight = document.querySelector("header")?.offsetHeight ?? 0;
  return Math.max(main.getBoundingClientRect().top + window.scrollY - headerHeight, 0);
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();
  const previousRef = useRef({ pathname, search });

  useLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { pathname, search };

    // Back/forward: let the browser restore its own scroll position.
    if (navigationType === "POP") return;

    // `/#about` and friends are left to the smooth hash scrolling in Header.
    if (hash) return;

    // "instant" overrides the global `scroll-behavior: smooth` in index.css so
    // the new page never animates through the old one.
    if (previous.pathname !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    // Query-only change: ignore filters/search, but follow pagination.
    const pageChanged =
      new URLSearchParams(previous.search).get("page") !==
      new URLSearchParams(search).get("page");
    if (pageChanged) {
      window.scrollTo({ top: contentTop(), left: 0, behavior: "instant" });
    }
  }, [pathname, search, hash, navigationType]);

  return null;
}

export default ScrollToTop;

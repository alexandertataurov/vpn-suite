import { useCallback, useEffect, useRef, useState } from "react";

export type TOCHeading = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  children: TOCHeading[];
};

type RawHeading = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  element: HTMLElement;
};

const DEFAULT_HEADER_HEIGHT = 56;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildNestedHeadings(raw: RawHeading[]): TOCHeading[] {
  const nested: TOCHeading[] = [];
  let lastH2: TOCHeading | null = null;
  let lastH3: TOCHeading | null = null;
  const h4CountsByH3 = new Map<string, number>();

  for (const item of raw) {
    if (item.level === 2) {
      const node: TOCHeading = {
        id: item.id,
        text: item.text,
        level: 2,
        children: [],
      };
      nested.push(node);
      lastH2 = node;
      lastH3 = null;
    } else if (item.level === 3) {
      const node: TOCHeading = {
        id: item.id,
        text: item.text,
        level: 3,
        children: [],
      };
      if (!lastH2) {
        nested.push(node);
        lastH2 = node;
      } else {
        lastH2.children.push(node);
      }
      lastH3 = node;
    } else {
      if (!lastH3) {
        continue;
      }
      const count = (h4CountsByH3.get(lastH3.id) ?? 0) + 1;
      h4CountsByH3.set(lastH3.id, count);
      if (count > 3) {
        continue;
      }
      const node: TOCHeading = {
        id: item.id,
        text: item.text,
        level: 4,
        children: [],
      };
      lastH3.children.push(node);
    }
  }

  return nested;
}

function applyHeaderHeightVariable(headerHeight: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--sb-header-height",
    `${headerHeight}px`,
  );
}

export function useTOC(
  containerSelector: string,
): {
  headings: TOCHeading[];
  activeId: string | null;
  scrollToSection: (id: string) => void;
} {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const headerHeightRef = useRef<number>(DEFAULT_HEADER_HEIGHT);
  const hasAppliedInitialHashRef = useRef(false);

  const scrollToSection = useCallback(
    (id: string) => {
      if (typeof document === "undefined" || typeof window === "undefined") {
        return;
      }

      const normalizedId = id.replace(/^#/, "");

      const container =
        containerSelector.trim().length > 0
          ? (document.querySelector(containerSelector) as HTMLElement | null)
          : null;

      const docsRoot =
        document.querySelector<HTMLElement>("[data-storybook-docs='docs-root']") ?? undefined;

      let target: HTMLElement | null =
        (container &&
          container.querySelector<HTMLElement>(`#${CSS.escape(normalizedId)}`)) ||
        document.getElementById(normalizedId);

      if (!target) {
        const searchRoot: HTMLElement | Document =
          (container as HTMLElement | null) ?? docsRoot ?? document;
        const headings = Array.from(
          searchRoot.querySelectorAll<HTMLElement>("h2, h3, h4"),
        );
        const match = headings.find((el) => {
          const text = el.textContent?.trim() ?? "";
          const slug = slugify(text);
          return slug === normalizedId;
        });
        if (match) {
          if (!match.id) {
            match.id = normalizedId;
          }
          target = match;
        }
      }

      if (!target) return;

      const header =
        document.querySelector<HTMLElement>(".sb-bar") ??
        document.querySelector<HTMLElement>("#storybook-explorer-menu");
      const headerHeight = header?.offsetHeight ?? headerHeightRef.current;
      headerHeightRef.current = headerHeight;
      applyHeaderHeightVariable(headerHeight);

      const offset = headerHeight + 16;
      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const nextTop = absoluteTop - offset;

      window.scrollTo({ top: nextTop, behavior: "smooth" });

      try {
        const hash = normalizedId ? `#${normalizedId}` : "";

        // Prefer updating the parent Storybook manager URL when running inside the preview iframe
        if (window.parent && window.parent !== window) {
          try {
            const parentUrl = new URL(window.parent.location.href);
            parentUrl.hash = hash.replace(/^#/, "");
            window.parent.history.replaceState(null, "", parentUrl.toString());
          } catch {
            const url = new URL(window.location.href);
            url.hash = hash.replace(/^#/, "");
            window.history.replaceState(null, "", url.toString());
          }
        } else {
          const url = new URL(window.location.href);
          url.hash = hash.replace(/^#/, "");
          window.history.replaceState(null, "", url.toString());
        }
      } catch {
        // ignore URL errors
      }

      activeIdRef.current = id;
      setActiveId(id);
    },
    [containerSelector],
  );

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const updateHeaderHeight = () => {
      const header =
        document.querySelector<HTMLElement>(".sb-bar") ??
        document.querySelector<HTMLElement>("#storybook-explorer-menu");
      const headerHeight = header?.offsetHeight ?? DEFAULT_HEADER_HEIGHT;
      headerHeightRef.current = headerHeight;
      applyHeaderHeightVariable(headerHeight);
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    let container: HTMLElement | null = null;

    const rebuildHeadings = () => {
      if (!containerSelector) {
        setHeadings([]);
        setActiveId(null);
        return;
      }

      container = document.querySelector(
        containerSelector,
      ) as HTMLElement | null;
      if (!container) {
        setHeadings([]);
        setActiveId(null);
        if (intersectionObserverRef.current) {
          intersectionObserverRef.current.disconnect();
          intersectionObserverRef.current = null;
        }
        return;
      }

      const nodeList = Array.from(
        container.querySelectorAll<HTMLElement>("h2, h3, h4"),
      );

      if (nodeList.length === 0) {
        setHeadings([]);
        setActiveId(null);
        if (intersectionObserverRef.current) {
          intersectionObserverRef.current.disconnect();
          intersectionObserverRef.current = null;
        }
        return;
      }

      const rawHeadings: RawHeading[] = nodeList.map((el, index) => {
        const tag = el.tagName.toLowerCase();
        const level: 2 | 3 | 4 = tag === "h2" ? 2 : tag === "h3" ? 3 : 4;
        const text = el.textContent?.trim() ?? "";
        const fallbackId = slugify(text) || `section-${index}`;
        const id = el.id || fallbackId;
        if (!el.id) {
          el.id = id;
        }
        return { id, text, level, element: el };
      });

      const nested = buildNestedHeadings(rawHeadings);
      setHeadings(nested);

      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        intersectionObserverRef.current = null;
      }

      const indexById = new Map<string, number>();
      rawHeadings.forEach((h, index) => {
        indexById.set(h.id, index);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => {
              const element = entry.target as HTMLElement;
              const id = element.id;
              const index = indexById.get(id) ?? 0;
              return {
                id,
                index,
                top: entry.boundingClientRect.top,
              };
            });

          if (visible.length === 0) {
            return;
          }

          visible.sort((a, b) => {
            if (a.top === b.top) {
              return a.index - b.index;
            }
            return a.top - b.top;
          });

          const nextId = visible[0]?.id;
          if (nextId && nextId !== activeIdRef.current) {
            activeIdRef.current = nextId;
            setActiveId(nextId);
          }
        },
        {
          root: null,
          rootMargin: "-80px 0px -60% 0px",
          threshold: 0,
        },
      );

      rawHeadings.forEach((h) => observer.observe(h.element));
      intersectionObserverRef.current = observer;

      if (!hasAppliedInitialHashRef.current) {
        hasAppliedInitialHashRef.current = true;
        let rawHash = "";
        try {
          if (window.parent && window.parent !== window) {
            rawHash = window.parent.location.hash;
          } else {
            rawHash = window.location.hash;
          }
        } catch {
          rawHash = window.location.hash;
        }
        const hashId = rawHash.replace(/^#/, "").trim();
        if (hashId) {
          window.setTimeout(() => {
            scrollToSection(hashId);
          }, 300);
        }
      }
    };

    const ensureContainerAndRebuild = () => {
      if (document.querySelector(containerSelector)) {
        rebuildHeadings();
        return true;
      }
      return false;
    };

    if (!ensureContainerAndRebuild()) {
      const intervalId = window.setInterval(() => {
        if (ensureContainerAndRebuild()) {
          window.clearInterval(intervalId);
        }
      }, 50);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
      }, 3000);
    }

    if (typeof MutationObserver !== "undefined") {
      const root =
        document.querySelector(containerSelector) ??
        document.querySelector<HTMLElement>("[data-storybook-docs='docs-root']");

      if (root) {
        const observer = new MutationObserver(() => {
          if (debounceTimerRef.current != null) {
            window.clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = window.setTimeout(() => {
            rebuildHeadings();
          }, 100);
        });

        observer.observe(root, {
          childList: true,
          subtree: true,
        });

        mutationObserverRef.current = observer;
      }
    }

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        intersectionObserverRef.current = null;
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
      }
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [containerSelector, scrollToSection]);

  return {
    headings,
    activeId,
    scrollToSection,
  };
}


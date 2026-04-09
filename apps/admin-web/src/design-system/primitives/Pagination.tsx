import type { MouseEvent } from "react";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageItem =
  | { type: "page"; page: number }
  | { type: "dots"; key: string }
  | { type: "prev" }
  | { type: "next" };

function buildPageItems(page: number, pageCount: number): PageItem[] {
  const items: PageItem[] = [];
  if (pageCount <= 1) return items;

  items.push({ type: "prev" });

  if (pageCount <= 7) {
    for (let p = 1; p <= pageCount; p += 1) {
      items.push({ type: "page", page: p });
    }
  } else {
    const showLeftDots = page > 4;
    const showRightDots = page < pageCount - 3;

    items.push({ type: "page", page: 1 });
    if (showLeftDots) {
      items.push({ type: "dots", key: "left-dots" });
    }

    const start = showLeftDots ? Math.max(2, page - 1) : 2;
    const end = showRightDots ? Math.min(pageCount - 1, page + 1) : pageCount - 1;
    for (let p = start; p <= end; p += 1) {
      items.push({ type: "page", page: p });
    }

    if (showRightDots) {
      items.push({ type: "dots", key: "right-dots" });
    }
    items.push({ type: "page", page: pageCount });
  }

  items.push({ type: "next" });
  return items;
}

export function Pagination({ page, pageCount, onPageChange, className = "" }: PaginationProps) {
  const items = buildPageItems(page, pageCount);

  const handleClick = (event: MouseEvent<HTMLButtonElement>, item: PageItem) => {
    event.preventDefault();
    if (item.type === "page") {
      if (item.page !== page) onPageChange(item.page);
    } else if (item.type === "prev") {
      if (page > 1) onPageChange(page - 1);
    } else if (item.type === "next") {
      if (page < pageCount) onPageChange(page + 1);
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className={["pagination", className || null].filter(Boolean).join(" ")} aria-label="Pagination">
      {items.map((item) => {
        if (item.type === "dots") {
          return (
            <button
              key={item.key}
              type="button"
              className="page-btn dots"
              disabled
              aria-hidden="true"
            >
              …
            </button>
          );
        }

        if (item.type === "prev") {
          return (
            <button
              key="prev"
              type="button"
              className="page-btn"
              onClick={(event) => handleClick(event, item)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              ←
            </button>
          );
        }

        if (item.type === "next") {
          return (
            <button
              key="next"
              type="button"
              className="page-btn"
              onClick={(event) => handleClick(event, item)}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              →
            </button>
          );
        }

        const isActive = item.page === page;
        return (
          <button
            key={item.page}
            type="button"
            className={["page-btn", isActive ? "active" : null].filter(Boolean).join(" ")}
            onClick={(event) => handleClick(event, item)}
            aria-current={isActive ? "page" : undefined}
          >
            {item.page}
          </button>
        );
      })}
    </nav>
  );
}


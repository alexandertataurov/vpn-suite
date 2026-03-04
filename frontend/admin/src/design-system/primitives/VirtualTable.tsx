import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";

interface VirtualTableProps<T> {
  items: T[];
  rowHeight: number;
  children: (item: T, index: number) => ReactNode;
  overscan?: number;
}

export function VirtualTable<T>({ items, rowHeight, children, overscan = 5 }: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  return (
    <div ref={parentRef} className="virtual-table__viewport">
      <div
        className="virtual-table__track"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (item === undefined) return null;
          return (
            <div
              key={virtualRow.key}
              className="virtual-table__row"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {children(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table } from "../table/Table";

describe("Table", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("uses keyExtractor when keyFn is not provided", () => {
    const columns = [
      { key: "a", header: "A", render: (r: { id: string }) => r.id },
    ];
    const data = [{ id: "1" }, { id: "2" }];
    const { container } = render(
      <Table
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        emptyMessage="Empty"
      />
    );
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("uses keyFn when provided", () => {
    const columns = [
      { key: "a", header: "A", render: (r: { id: number }) => String(r.id) },
    ];
    const data = [{ id: 1 }];
    render(
      <Table
        columns={columns}
        data={data}
        keyFn={(r) => r.id}
        emptyMessage="Empty"
      />
    );
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("throws when neither keyFn nor keyExtractor provided", () => {
    const columns = [
      { key: "a", header: "A", render: (r: { id: string }) => r.id },
    ];
    const data = [{ id: "1" }];
    expect(() =>
      Table({ columns, data, emptyMessage: "Empty" })
    ).toThrow("Table requires keyFn or keyExtractor");
  });

  it("renders cell with null when column.render is not a function", () => {
    const columns = [
      { key: "a", header: "A", render: (r: { id: string }) => r.id },
      { key: "b", header: "B", render: undefined as unknown as (r: { id: string }) => string },
    ];
    const data = [{ id: "1" }];
    render(
      <Table
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        emptyMessage="Empty"
      />
    );
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("applies data-testid table-root when data present", () => {
    const columns = [{ key: "a", header: "A", render: (r: { id: string }) => r.id }];
    const data = [{ id: "1" }];
    const { container } = render(
      <Table columns={columns} data={data} keyExtractor={(r) => r.id} />
    );
    const wrap = container.querySelector('[data-testid="table-root"]');
    expect(wrap).toBeTruthy();
  });

  it("applies data-testid table-root for empty state", () => {
    const columns = [{ key: "a", header: "A", render: (r: { id: string }) => r.id }];
    const { container } = render(
      <Table columns={columns} data={[]} keyExtractor={(r) => r.id} emptyMessage="No rows" />
    );
    const empty = container.querySelector('[data-testid="table-root"]');
    expect(empty).toBeTruthy();
  });

  it("applies ds-table-density-compact when density is compact", () => {
    const columns = [{ key: "a", header: "A", render: (r: { id: string }) => r.id }];
    const data = [{ id: "1" }];
    const { container } = render(
      <Table columns={columns} data={data} keyExtractor={(r) => r.id} density="compact" />
    );
    const wrap = container.querySelector(".ds-table-density-compact");
    expect(wrap).toBeTruthy();
  });

  it("applies numeric and align props for numeric column", () => {
    const columns = [
      {
        key: "val",
        header: "Value",
        numeric: true,
        align: "right" as const,
        render: (r: { id: string; val: number }) => String(r.val),
      },
    ];
    const data = [{ id: "1", val: 42 }];
    const { container } = render(
      <Table columns={columns} data={data} keyExtractor={(r) => r.id} />
    );
    const td = container.querySelector("td");
    expect(td?.classList.contains("ds-table-cell-numeric")).toBe(true);
    expect(td?.getAttribute("data-align")).toBe("right");
  });
});

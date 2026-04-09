import React from "react";
import { useParameter } from "@storybook/manager-api";

interface TokenRow {
  token: string;
  role: string;
  value: string;
  category?: string;
  swatch?: string;
}

export function DesignTokensPanel() {
  const docs = useParameter<{ tokens?: TokenRow[] }>("docs", {});
  const tokens = docs?.tokens ?? [];

  if (tokens.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--sb-main-text-color, #666)", fontSize: 13 }}>
        No design tokens for this story. Add <code>parameters.docs.tokens</code> to the story meta.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, overflowX: "auto" }}>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--sb-border-color, #eee)" }}>
            <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600 }}>Token</th>
            <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600 }}>Role</th>
            <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600 }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((row) => (
            <tr key={row.token} style={{ borderBottom: "1px solid var(--sb-border-color, #eee)" }}>
              <td style={{ padding: "6px", fontFamily: "monospace", color: "var(--sb-accent-color, #0ea5e9)" }}>{row.token}</td>
              <td style={{ padding: "6px", color: "var(--sb-dimmed-text-color, #666)" }}>{row.role}</td>
              <td style={{ padding: "6px", display: "flex", alignItems: "center", gap: 8 }}>
                {row.swatch != null && (
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 2,
                      backgroundColor: row.swatch,
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  />
                )}
                <code style={{ fontSize: 11 }}>{row.value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

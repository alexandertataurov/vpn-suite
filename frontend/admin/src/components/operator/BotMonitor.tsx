import { useState, useEffect, useRef, useCallback } from "react";
import type { CommandFeedType } from "./CommandFeedItem";
import { CommandFeedItem } from "./CommandFeedItem";

export interface BotLogEntry {
  ts: string;
  tag: string;
  message: string;
  actor?: string;
}

function tagToType(tag: string): CommandFeedType {
  const t = tag.toUpperCase();
  if (t === "SYS") return "SYS";
  if (t === "CMD" || t === "USER") return "CMD";
  if (t === "DEV") return "DEV";
  if (t === "ERR" || t === "WARN" || t === "WARNING") return "ERR";
  return "SYS";
}

function extractActor(message: string): string | undefined {
  const m = message.match(/@[\w.-]+/);
  return m?.[0];
}

export interface BotMonitorProps {
  /** Log entries from API. Empty = empty state. */
  entries?: BotLogEntry[];
  /** Fixed height in px. Default 200. */
  height?: number;
  /** Show command input at bottom for manual broadcasts/pings */
  showCommandInput?: boolean;
  /** Called when user submits command (future: API integration) */
  onCommand?: (cmd: string) => void;
}

const SCROLL_THRESHOLD = 40;

export function BotMonitor({
  entries = [],
  height = 200,
  showCommandInput = false,
  onCommand,
}: BotMonitorProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<BotLogEntry[]>(entries ?? []);
  const [autoScroll, setAutoScroll] = useState(true);
  const [cmd, setCmd] = useState("");

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = cmd.trim();
    if (!c) return;
    onCommand?.(c);
    setCmd("");
  };

  useEffect(() => {
    setLogs(entries ?? []);
  }, [entries]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.style.setProperty("--bot-monitor-height", `${height}px`);
  }, [height]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    if (autoScroll) scrollToBottom();
  }, [logs, autoScroll, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
    setAutoScroll(nearBottom);
  }, []);

  return (
    <div
      className="bot-monitor"
      role="log"
      aria-label="Telegram Bot command feed"
      aria-live="polite"
    >
      <div className="bot-monitor-header">
        <span className="bot-monitor-title">Command Feed</span>
      </div>
      <div
        ref={listRef}
        className="bot-monitor-content"
        onScroll={handleScroll}
        role="log"
        data-empty={logs.length === 0 ? "true" : undefined}
      >
        {logs.length === 0 ? (
          <div className="bot-monitor-empty" role="status">
            <span className="bot-monitor-empty-icon" aria-hidden>—</span>
            <span>No command events</span>
          </div>
        ) : logs.map((e, i) => (
          <CommandFeedItem
            key={i}
            timestamp={e.ts}
            type={tagToType(e.tag)}
            actor={e.actor ?? extractActor(e.message)}
            message={e.message}
          />
        ))}
      </div>
      {showCommandInput && (
        <form className="bot-monitor-command" onSubmit={handleCommandSubmit}>
          <span className="bot-monitor-prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="broadcast|ping|..."
            className="bot-monitor-input"
            aria-label="Command input"
          />
          <button type="submit" className="bot-monitor-send" aria-label="Send command">
            ↵
          </button>
        </form>
      )}
    </div>
  );
}

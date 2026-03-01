import { cn } from "@vpn-suite/shared";

export type CommandFeedType = "SYS" | "CMD" | "DEV" | "ERR";

export interface CommandFeedItemProps {
  timestamp: string;
  type: CommandFeedType;
  actor?: string;
  message: string;
}

const typeBorderClass: Record<CommandFeedType, string> = {
  SYS: "command-feed-item--sys",
  CMD: "command-feed-item--cmd",
  DEV: "command-feed-item--dev",
  ERR: "command-feed-item--err",
};

export function CommandFeedItem({ timestamp, type, actor, message }: CommandFeedItemProps) {
  return (
    <div className={cn("command-feed-item", typeBorderClass[type])}>
      <span className="command-feed-item__ts font-data">{timestamp}</span>
      {actor ? <span className="command-feed-item__actor">{actor}</span> : null}
      <span className="command-feed-item__msg">{message}</span>
    </div>
  );
}

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, StatRow } from "../ui";

export interface StatCardItem {
  label: ReactNode;
  value: ReactNode;
}

export interface StatCardProps {
  title: ReactNode;
  actions?: ReactNode;
  items: StatCardItem[];
}

export function StatCard({ title, actions, items }: StatCardProps) {
  return (
    <Card as="article">
      <CardHeader>
        <CardTitle as="h3">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        {items.map((item, index) => (
          <StatRow key={`${index}-${String(item.label)}`} label={item.label} value={item.value} />
        ))}
      </CardContent>
    </Card>
  );
}

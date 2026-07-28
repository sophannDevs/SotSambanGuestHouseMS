import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailSectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// A titled, read-only content block for detail pages — the Card
// composition the shadcn skill's own rule asks for ("don't dump everything
// in CardContent") instead of a hand-rolled bordered div with its own
// heading markup per page.
export function DetailSection({ title, action, children, className }: DetailSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

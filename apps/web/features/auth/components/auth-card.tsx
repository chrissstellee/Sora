import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <Card className={cn("relative w-full max-w-[480px] overflow-hidden py-8", className)}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-linear-120 from-primary via-soft-destructive to-secondary" />
      <CardHeader className="gap-3 px-8 pb-2">
        <CardTitle className="text-3xl font-bold text-foreground">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-8">{children}</CardContent>
    </Card>
  );
}

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color?: "primary" | "secondary" | "success" | "warning";
}

const colorStyles = {
  primary: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  secondary: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  success: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export function StatsCard({ title, value, icon: Icon, color = "primary" }: StatsCardProps) {
  return (
    <div className="glass-card p-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium transition-colors">{title}</p>
          <p className="text-3xl font-bold text-foreground transition-all duration-300">{value}</p>
        </div>
        <div className={cn("p-4 rounded-xl border backdrop-blur-sm transition-all duration-300", colorStyles[color])}>
          <Icon size={24} className="transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
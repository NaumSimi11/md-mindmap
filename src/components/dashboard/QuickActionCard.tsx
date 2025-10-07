import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "creative";
}

const variantStyles = {
  primary: "glass-card hover:bg-purple-500/10 transition-all duration-300",
  secondary: "glass-card hover:bg-blue-500/10 transition-all duration-300", 
  success: "glass-card hover:bg-purple-500/10 transition-all duration-300",
  warning: "glass-card hover:bg-amber-500/10 transition-all duration-300",
  creative: "glass-card hover:bg-pink-500/10 transition-all duration-300",
};

const iconStyles = {
  primary: "text-purple-400 transition-colors duration-300",
  secondary: "text-blue-400 transition-colors duration-300",
  success: "text-purple-400 transition-colors duration-300", 
  warning: "text-amber-400 transition-colors duration-300",
  creative: "text-pink-400 transition-colors duration-300",
};

const gradientBg = {
  primary: "",
  secondary: "",
  success: "",
  warning: "",
  creative: "",
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "primary"
}: QuickActionCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group cursor-pointer p-6 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
        variantStyles[variant]
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4 relative z-10">
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 dark:bg-white/5 dark:border-white/10 bg-black/5 border-black/10">
          <Icon size={28} className={cn("transition-colors duration-300", iconStyles[variant])} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-2 text-lg transition-all duration-300">{title}</h3>
          <p className="text-sm text-muted-foreground transition-colors duration-300 leading-relaxed">{description}</p>
        </div>
      </div>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-white/5 via-transparent to-white/5 dark:from-white/5 dark:to-white/5 from-black/5 to-black/5"></div>
    </div>
  );
}
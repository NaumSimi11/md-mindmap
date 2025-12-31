import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active-press",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg shadow-blue-500/40 dark:shadow-blue-400/30 hover:shadow-blue-500/50 dark:hover:shadow-blue-400/40 hover:shadow-xl hover-lift border border-blue-500/20 dark:border-blue-400/20",
        destructive: "bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white shadow-lg shadow-red-500/40 dark:shadow-red-400/30 hover:shadow-red-500/50 dark:hover:shadow-red-400/40 hover:shadow-xl hover-lift border border-red-500/20 dark:border-red-400/20",
        outline: "border-2 border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-xl text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-black/20 hover:border-white/30 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white hover-lift shadow-sm hover:shadow-md",
        secondary: "bg-white/80 dark:bg-black/40 backdrop-blur-xl text-slate-700 dark:text-slate-300 border border-white/30 dark:border-white/20 hover:bg-white/90 dark:hover:bg-black/60 hover:text-slate-900 dark:hover:text-white hover-lift shadow-sm hover:shadow-md",
        ghost: "text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-black/20 hover:text-slate-900 dark:hover:text-white hover-lift",
        link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200",
        premium: "bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 dark:from-purple-500 dark:via-purple-600 dark:to-pink-500 text-white shadow-lg shadow-purple-500/40 dark:shadow-purple-400/30 hover:shadow-purple-500/60 dark:hover:shadow-purple-400/50 hover:shadow-2xl hover-lift border border-purple-500/20 dark:border-purple-400/20",
        success: "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white shadow-lg shadow-green-500/40 dark:shadow-green-400/30 hover:shadow-green-500/50 dark:hover:shadow-green-400/40 hover:shadow-xl hover-lift border border-green-500/20 dark:border-green-400/20",
        apple: "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 text-white shadow-xl shadow-blue-500/50 dark:shadow-blue-400/40 hover:shadow-blue-500/70 dark:hover:shadow-blue-400/60 hover:shadow-2xl hover-lift border border-blue-500/30 dark:border-blue-400/30 ring-1 ring-white/20 dark:ring-black/20",
        appleSecondary: "bg-white/90 dark:bg-black/40 backdrop-blur-xl text-slate-700 dark:text-slate-300 border-2 border-slate-200/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-black/60 hover:border-slate-300/70 dark:hover:border-slate-500/70 hover:shadow-xl hover-lift shadow-lg shadow-slate-200/20 dark:shadow-black/40",
        appleGhost: "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover-lift transition-all duration-300 rounded-xl",
        appleDanger: "bg-gradient-to-r from-red-500 via-red-600 to-red-700 dark:from-red-500 dark:via-red-600 dark:to-red-700 text-white shadow-xl shadow-red-500/50 dark:shadow-red-400/40 hover:shadow-red-500/70 dark:hover:shadow-red-400/60 hover:shadow-2xl hover-lift border border-red-500/30 dark:border-red-400/30 ring-1 ring-white/20 dark:ring-black/20",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-11 w-11",
        xl: "h-14 px-10 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

// Apple-style button component for premium interactions
export interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function AppleButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: AppleButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-300 active-press relative overflow-hidden";

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 text-white shadow-xl shadow-blue-500/50 dark:shadow-blue-400/40 hover:shadow-blue-500/70 dark:hover:shadow-blue-400/60 hover:shadow-2xl hover-lift border border-blue-500/30 dark:border-blue-400/30",
    secondary: "bg-white/90 dark:bg-black/40 backdrop-blur-xl text-slate-700 dark:text-slate-300 border-2 border-slate-200/50 dark:border-slate-600/50 hover:bg-white dark:hover:bg-black/60 hover:border-slate-300/70 dark:hover:border-slate-500/70 hover:shadow-xl hover-lift shadow-lg",
    ghost: "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover-lift",
    danger: "bg-gradient-to-r from-red-500 via-red-600 to-red-700 dark:from-red-500 dark:via-red-600 dark:to-red-700 text-white shadow-xl shadow-red-500/50 dark:shadow-red-400/40 hover:shadow-red-500/70 dark:hover:shadow-red-400/60 hover:shadow-2xl hover-lift"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export { Button, buttonVariants };

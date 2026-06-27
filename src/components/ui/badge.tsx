import { cn } from "@/lib/utils";

interface Props { children: React.ReactNode; variant?: "default" | "secondary" | "outline"; className?: string; }

export function Badge({ children, variant = "default", className }: Props) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variant === "default" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      variant === "secondary" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      variant === "outline" && "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
      className
    )}>{children}</span>
  );
}

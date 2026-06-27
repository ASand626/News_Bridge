"use client";
import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export function TabsList({ className, ...p }: T.TabsListProps) {
  return <T.List className={cn("flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1", className)} {...p} />;
}

export function TabsTrigger({ className, ...p }: T.TabsTriggerProps) {
  return (
    <T.Trigger
      className={cn(
        "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all text-zinc-500 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm",
        className
      )}
      {...p}
    />
  );
}

export function TabsContent({ className, ...p }: T.TabsContentProps) {
  return <T.Content className={cn("mt-4", className)} {...p} />;
}

"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NewsCategory } from "@/types";

const CATS: { id: NewsCategory; label: string; icon: string }[] = [
  { id: "ai", label: "AI", icon: "🤖" },
  { id: "web3", label: "Web3", icon: "⛓️" },
  { id: "finance", label: "金融", icon: "💰" },
  { id: "economy", label: "経済", icon: "📊" },
  { id: "tech", label: "テック", icon: "💻" },
];

export function CategoryBar() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get("category") ?? "ai") as NewsCategory;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => router.push(`/?category=${id}`)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            current === id
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

import type { ImpactCard } from "@/types";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  world: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
  japan: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40",
  investment: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40",
  web3: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40",
  life: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40",
  tech: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40",
};

const TITLE_COLORS: Record<string, string> = {
  world: "text-blue-700 dark:text-blue-300",
  japan: "text-red-700 dark:text-red-300",
  investment: "text-green-700 dark:text-green-300",
  web3: "text-purple-700 dark:text-purple-300",
  life: "text-orange-700 dark:text-orange-300",
  tech: "text-indigo-700 dark:text-indigo-300",
};

export function ImpactCards({ cards }: { cards: ImpactCard[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span>🔮</span>
        <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">④ 何が変わる？</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl border p-4 space-y-2 transition-all",
              COLORS[card.category] ?? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{card.icon}</span>
              <span className={cn("font-semibold text-sm", TITLE_COLORS[card.category] ?? "text-zinc-700 dark:text-zinc-300")}>
                {card.title}
              </span>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{card.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummarySection({ summary }: { summary: string }) {
  const lines = summary.split("\n").map((l) => l.replace(/^[・•]\s*/, "").trim()).filter(Boolean);
  return (
    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100 dark:border-blue-900/40">
        <span>⚡</span>
        <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300">① 何が起きた？</h3>
      </div>
      <div className="p-4">
        <ol className="space-y-3">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed pt-0.5">{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

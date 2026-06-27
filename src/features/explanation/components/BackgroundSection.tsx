export function BackgroundSection({ background }: { background: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <span>📖</span>
        <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">② なぜ起きた？</h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{background}</p>
      </div>
    </div>
  );
}

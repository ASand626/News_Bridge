"use client";

interface Props {
  textFallback: string;
}

export function CausalChain({ textFallback }: Props) {
  const arrows = textFallback.split(/→|->/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {arrows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {arrows.map((step, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-3 py-1.5 text-sm font-medium text-blue-800 dark:text-blue-200">
                {step}
              </span>
              {i < arrows.length - 1 && (
                <span className="text-zinc-400 dark:text-zinc-500 font-bold">→</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

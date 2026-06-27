"use client";
import { useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { TermModal } from "./TermModal";

interface Popup {
  x: number;
  y: number;
  term: string;
}

export function TermSelector({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  useEffect(() => {
    function handleSelectionEnd() {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";

      // 1〜30文字の選択のみ対象
      if (text.length < 1 || text.length > 30 || !sel?.rangeCount) {
        setPopup(null);
        return;
      }
      const range = sel.getRangeAt(0);
      // コンテナ内の選択のみ対象
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        setPopup(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setPopup({
        x: rect.left + rect.width / 2,
        y: rect.top - 48,
        term: text,
      });
    }

    document.addEventListener("mouseup", handleSelectionEnd);
    document.addEventListener("touchend", handleSelectionEnd);
    return () => {
      document.removeEventListener("mouseup", handleSelectionEnd);
      document.removeEventListener("touchend", handleSelectionEnd);
    };
  }, []);

  function openModal(term: string) {
    setPopup(null);
    window.getSelection()?.removeAllRanges();
    setActiveTerm(term);
  }

  return (
    <div ref={containerRef} className={className}>
      {children}

      {popup && (
        <div
          className="fixed z-40 flex items-center"
          style={{ left: popup.x, top: popup.y, transform: "translateX(-50%)" }}
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openModal(popup.term)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors whitespace-nowrap"
          >
            <BookOpen size={12} />
            「{popup.term}」を調べる
          </button>
        </div>
      )}

      {activeTerm && (
        <TermModal term={activeTerm} onClose={() => setActiveTerm(null)} />
      )}
    </div>
  );
}

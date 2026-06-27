"use client";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, BookOpen, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { supabase } from "@/lib/supabase/client";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const avatarLetter = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-zinc-100 shrink-0">
            <BookOpen size={20} className="text-blue-500" />
            News Bridge
          </Link>

          <div className="flex items-center gap-1.5">
            {/* ログイン状態 */}
            {supabase && !loading && (
              user ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {avatarLetter}
                    </div>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:block max-w-[120px] truncate">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => supabase?.auth.signOut()}
                    aria-label="ログアウト"
                    title="ログアウト"
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-1.5 text-xs h-8 rounded-xl"
                >
                  <LogIn size={14} />
                  ログイン
                </Button>
              )
            )}

            {/* テーマ切替 */}
            <Button
              variant="ghost" size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="テーマ切替"
            >
              <Sun size={18} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon size={18} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

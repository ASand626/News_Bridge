"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function AuthModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>ログイン / 新規登録</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="mx-auto text-green-500" size={40} />
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">メールを送信しました</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>{" "}
              に届いたリンクをクリックするとログインできます。
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              別の端末でも同じメールアドレスでログインするとデータが同期されます。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 text-sm font-medium transition-colors"
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : <Mail size={15} />}
              ログインリンクを送る
            </button>

            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
              パスワード不要。メールのリンクをタップするだけでログインできます。
              登録不要で、初回は自動でアカウントが作られます。
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

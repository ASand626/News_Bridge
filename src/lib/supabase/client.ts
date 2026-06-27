import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 設定済みの場合のみクライアントを返す（未設定ならlocalStorageフォールバック）
export const supabase =
  url && !url.startsWith("your_")
    ? createBrowserClient(url, key)
    : null;

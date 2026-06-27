import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "AIチャット — News Bridge" };

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <MessageSquare size={22} className="text-blue-500" />
          AIチャット
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          NISA・Web3・AI・経済について何でも聞いてください
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 h-[calc(100vh-220px)] flex flex-col">
        <ChatPanel />
      </div>
    </div>
  );
}

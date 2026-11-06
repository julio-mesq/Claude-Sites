"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

export function ShareAchievement({ code, name }: { code: string; name: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="mt-3 inline-flex items-center gap-1.5 text-xs text-neon hover:underline disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          await api("/community/posts", { method: "POST", body: { content: `Desbloqueei a conquista ${name} no FitLife! 🏆`, achievementCode: code, visibility: "PUBLIC" } });
          toast.success("Conquista compartilhada na comunidade.");
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Erro ao compartilhar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Share2 className="h-3.5 w-3.5" /> Compartilhar
    </button>
  );
}

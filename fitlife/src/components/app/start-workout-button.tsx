"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button, type ButtonProps } from "@/components/ui/button";

export function StartWorkoutButton({ workoutId, label = "Iniciar treino", ...props }: { workoutId?: string; label?: string } & ButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      {...props}
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const s = await api<{ id: string; workoutId: string | null }>("/sessions", { method: "POST", body: workoutId ? { workoutId } : {} });
          if (workoutId && s.workoutId && s.workoutId !== workoutId) toast.info("Você já tem um treino em andamento. Retomando.");
          router.push(`/app/workouts/session/${s.id}`);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Não foi possível iniciar.");
          setLoading(false);
        }
      }}
    >
      {!loading && <Play className="h-4 w-4 fill-current" />} {label}
    </Button>
  );
}

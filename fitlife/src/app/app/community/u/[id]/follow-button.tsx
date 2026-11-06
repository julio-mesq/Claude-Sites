"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function FollowButton({ userId, initial }: { userId: string; initial: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant={following ? "secondary" : "primary"}
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const r = await api<{ following: boolean }>(`/community/users/${userId}/follow`, { method: "POST" });
          setFollowing(r.following);
          router.refresh();
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Erro.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}

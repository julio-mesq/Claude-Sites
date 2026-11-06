import { route } from "@/server/http";
import { overview } from "@/server/services/admin";
export const GET = route({ role: "MODERATOR" }, async () => overview());

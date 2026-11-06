import { route } from "@/server/http";
import { exportUserData } from "@/server/services/privacy";
export const GET = route({ role: "USER" }, async ({ user }) => {
  const data = await exportUserData(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="fitlife-dados-${new Date().toISOString().slice(0, 10)}.json"` },
  });
});

import { route } from "@/server/http";
export const GET = route({ role: "USER" }, async ({ user }) => {
  const { sessionId: _s, ...rest } = user;
  return { user: rest };
});

import { db } from "@/server/db";
import { features } from "@/server/env";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok", features, time: new Date().toISOString() });
  } catch {
    return Response.json({ status: "degraded", db: "error" }, { status: 503 });
  }
}

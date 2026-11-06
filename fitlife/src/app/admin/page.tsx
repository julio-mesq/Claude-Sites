import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guard";
import { overview } from "@/server/services/admin";
import { AdminApp } from "./admin-app";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage() {
  const user = await requireRole("MODERATOR");
  const data = await overview();
  return <AdminApp role={user.role} me={user.id} overview={data} />;
}

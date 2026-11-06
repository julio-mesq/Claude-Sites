import { route, body } from "@/server/http";
import { measurementSchema } from "@/lib/validations/tracking";
import { addMeasurement, compareMeasurements, listMeasurements } from "@/server/services/progress";
export const GET = route({ role: "USER" }, async ({ req, user }) => {
  const a = req.nextUrl.searchParams.get("a") ?? undefined;
  const b = req.nextUrl.searchParams.get("b") ?? undefined;
  return { items: await listMeasurements(user.id), compare: await compareMeasurements(user.id, a, b) };
});
export const POST = route({ role: "USER" }, async ({ req, user }) => addMeasurement(user.id, await body(req, measurementSchema)));

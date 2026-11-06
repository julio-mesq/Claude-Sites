import { NextResponse, type NextRequest } from "next/server";

// Limpa um cookie de sessão inválido/expirado e volta ao login (evita loops de redirecionamento).
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?expired=1", req.url));
  res.cookies.delete("fl_session");
  return res;
}

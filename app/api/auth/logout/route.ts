import { apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export async function POST() {
  const res = apiSuccess({ message: MSG.auth.logoutSuccess });
  res.cookies.set({
    name: "site-auth",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return res;
}

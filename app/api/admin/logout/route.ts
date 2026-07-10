import { apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export async function POST() {
  const res = apiSuccess({ message: MSG.auth.logoutSuccess });
  res.cookies.set("admin-auth", "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}

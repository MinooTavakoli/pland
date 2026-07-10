import { SignJWT, jwtVerify, JWTPayload } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type UserRole = "USER" | "ADMIN";

export interface AuthPayload extends JWTPayload {
  userId: number | string;
  role: UserRole;
}

export async function signToken(payload: {
  userId: number | string;
  role: UserRole;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify<AuthPayload>(token, secret);
    return payload;
  } catch (err) {
    console.error("JWT VERIFY ERROR 👉", err);
    return null;
  }
}

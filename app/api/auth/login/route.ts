import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, verifyPassword, SESSION_NAME } from "@/lib/auth";

const AUTH_USERNAME = process.env.AUTH_USERNAME || "admin";
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "admin";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username !== AUTH_USERNAME) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    let isValid = false;
    if (AUTH_PASSWORD_HASH) {
      isValid = await verifyPassword(password, AUTH_PASSWORD_HASH);
    } else {
      isValid = password === AUTH_PASSWORD;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken(username);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

/**
 * Utility endpoint to generate bcrypt hashes for passwords.
 * Only available in development mode.
 * 
 * Usage: POST /api/auth/hash with { "password": "your-password" }
 * Returns: { "hash": "$2b$06$..." }
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const hash = await hashPassword(password);

    return NextResponse.json({ 
      hash,
      usage: "Set AUTH_PASSWORD_HASH in your .env.local with this value"
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}


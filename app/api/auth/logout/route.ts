import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_NAME = "jira-pm-session";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);

  return NextResponse.json({ success: true });
}


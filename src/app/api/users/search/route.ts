import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { searchUsers } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ users: [] });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ users: [] });

  const users = await searchUsers(q, 6);
  return NextResponse.json({ users });
}

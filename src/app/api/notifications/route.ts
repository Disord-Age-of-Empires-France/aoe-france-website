import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserNotifications, markAllNotificationsRead, deleteAllNotifications } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ notifications: [], unreadCount: 0 });
  const notifications = await getUserNotifications(session.userId);
  const unreadCount = notifications.filter(n => !n.readAt).length;
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  await markAllNotificationsRead(session.userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  await deleteAllNotifications(session.userId);
  return NextResponse.json({ ok: true });
}

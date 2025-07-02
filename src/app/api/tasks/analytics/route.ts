import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const total = await prisma.task.count({ where: { userId: user.id } });
    const completed = await prisma.task.count({ where: { userId: user.id, status: "completed" } });
    const pending = await prisma.task.count({ where: { userId: user.id, status: "pending" } });
    const inProgress = await prisma.task.count({ where: { userId: user.id, status: "in-progress" } });
    // Completed per day for last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const completedPerDay = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId: user.id,
        status: "completed",
        createdAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });
    // Format per day
    const perDay: { date: string, count: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = completedPerDay.find(g => g.createdAt.toISOString().slice(0, 10) === dateStr);
      perDay.push({ date: dateStr, count: found?._count.id || 0 });
    }
    return NextResponse.json({ total, completed, pending, inProgress, completedPerDay: perDay });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
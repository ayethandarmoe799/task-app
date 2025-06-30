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
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { name, color } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }
    // Check for duplicate
    const existing = await prisma.tag.findFirst({ where: { name: { equals: name, mode: "insensitive" }, userId: user.id } });
    if (existing) {
      return NextResponse.json(existing);
    }
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#6B7280",
        userId: user.id,
      },
    });
    return NextResponse.json(tag);
  } catch (error: any) {
    console.error("Error creating tag:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Tag name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
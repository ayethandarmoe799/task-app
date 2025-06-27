import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  console.log(session);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (req.method === "GET") {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(tasks);
  }

  if (req.method === "POST") {
    const { title, description, status } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "pending",
        userId: user.id,
      },
    });
    return res.status(201).json(task);
  }

  return res.status(405).json({ error: "Method not allowed" });
} 
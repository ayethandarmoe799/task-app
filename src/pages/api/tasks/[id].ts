import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid task id" });
  }

  if (req.method === "PATCH") {
    const { title, description, status } = req.body;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== user.id) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title, description, status },
    });
    return res.status(200).json(updatedTask);
  }

  if (req.method === "DELETE") {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== user.id) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }
    await prisma.task.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
} 
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { IncomingForm, File, Fields, Files } from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { fields, files } = await parseForm(req);
    let name = "";
    if (fields.name) {
      name = Array.isArray(fields.name)
        ? (fields.name[0] || "")
        : (fields.name as string);
    }
    let imagePath = user.image;

    if (files.image) {
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      if (file && file.filepath && file.originalFilename) {
        const fileName = `${user.id}_${Date.now()}_${file.originalFilename}`;
        const destPath = path.join(process.cwd(), "public", "uploads", fileName);
        fs.renameSync(file.filepath, destPath);
        imagePath = `/uploads/${fileName}`;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { name, image: imagePath },
    });

    return res.status(200).json({ success: true, name, image: imagePath });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 
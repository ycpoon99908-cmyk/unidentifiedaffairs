import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";

const SubmissionCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(20).max(20000),
  authorName: z.string().trim().min(1).max(60).optional(),
  contact: z.string().trim().min(1).max(120).optional(),
  categorySuggestion: z.string().trim().min(1).max(60).optional(),
  thumbnailPath: z.string().trim().max(300).optional(),
  videoPath: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = SubmissionCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const submission = await prisma.submission.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      authorName: parsed.data.authorName,
      contact: parsed.data.contact,
      categorySuggestion: parsed.data.categorySuggestion,
      thumbnailPath: parsed.data.thumbnailPath,
      videoPath: parsed.data.videoPath,
      status: "PENDING",
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ submission }, { status: 201 });
}

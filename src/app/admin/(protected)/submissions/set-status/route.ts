import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireAdminApi } from "@/server/adminApi";
import { logAudit } from "@/server/audit";

async function ensureUniquePostSlug(base: string) {
  const root = base.trim();
  if (!root) return root;
  const existing = await prisma.post.findUnique({ where: { slug: root }, select: { id: true } });
  if (!existing) return root;
  for (let i = 2; i <= 20; i += 1) {
    const next = `${root}-${i}`;
    const taken = await prisma.post.findUnique({ where: { slug: next }, select: { id: true } });
    if (!taken) return next;
  }
  return `${root}-${Date.now()}`;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth) return NextResponse.redirect(new URL("/admin/login", request.url));

  const formData = await request.formData().catch(() => null);
  const id = String(formData?.get("id") ?? "");
  const status = String(formData?.get("status") ?? "");

  if (!id || (status !== "PENDING" && status !== "APPROVED" && status !== "REJECTED")) {
    revalidatePath("/admin/submissions");
    return NextResponse.redirect(new URL("/admin/submissions", request.url));
  }

  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { status, reviewedAt: status === "PENDING" ? null : new Date() },
    });
    await logAudit({
      action: "submission_set_status",
      entityType: "Submission",
      entityId: id,
      adminUserId: auth.admin.id,
      metadata: { status },
    });

    if (status === "APPROVED") {
      const existingPost = await prisma.post.findFirst({
        where: { sourceSubmissionId: id },
        select: { id: true },
      });

      if (existingPost) {
        await prisma.post.update({
          where: { id: existingPost.id },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
        await logAudit({
          action: "submission_publish_existing_post",
          entityType: "Post",
          entityId: existingPost.id,
          adminUserId: auth.admin.id,
          metadata: { submissionId: id },
        });
      } else {
        const baseSlug = id.slice(0, 10);
        const uniqueSlug = await ensureUniquePostSlug(baseSlug);
        const created = await prisma.post.create({
          data: {
            title: submission.title,
            slug: uniqueSlug,
            content: submission.content,
            excerpt: null,
            thumbnailPath: submission.thumbnailPath,
            videoPath: submission.videoPath,
            status: "PUBLISHED",
            publishedAt: new Date(),
            sourceSubmissionId: id,
          },
          select: { id: true },
        });
        await logAudit({
          action: "submission_publish_new_post",
          entityType: "Post",
          entityId: created.id,
          adminUserId: auth.admin.id,
          metadata: { submissionId: id },
        });
      }
    }
  } catch (err) {
    console.error("submission_set_status_failed", err);
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/posts");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/submissions", request.url));
}

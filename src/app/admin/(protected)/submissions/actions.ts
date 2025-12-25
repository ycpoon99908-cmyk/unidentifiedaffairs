"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";
import { logAudit } from "@/server/audit";

const SubmissionUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2).max(140),
  content: z.string().trim().min(20).max(20000),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

const PostFromSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(1).max(140),
  excerpt: z.string().trim().max(240).optional().or(z.literal("")),
  content: z.string().trim().min(1).max(200000),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().optional().or(z.literal("")),
});

const PostFromMergedSchema = z.object({
  submissionIds: z.string().min(1),
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(1).max(140),
  excerpt: z.string().trim().max(240).optional().or(z.literal("")),
  content: z.string().trim().min(1).max(200000),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().optional().or(z.literal("")),
});

function parseDateTimeLocal(value: string | undefined) {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

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

export async function updateSubmission(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = SubmissionUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content"),
    adminNotes: formData.get("adminNotes"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }

  try {
    await prisma.submission.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        adminNotes: parsed.data.adminNotes || null,
        status: parsed.data.status,
        reviewedAt: parsed.data.status === "PENDING" ? null : new Date(),
      },
    });

    await logAudit({
      action: "submission_update",
      entityType: "Submission",
      entityId: parsed.data.id,
      adminUserId: admin.id,
    });
  } catch (err) {
    console.error("submission_update_failed", err);
  }
  revalidatePath("/admin/submissions");
  redirect("/admin/submissions");
}

export async function deleteSubmission(formData: FormData) {
  const { admin } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }
  try {
    await prisma.submission.delete({ where: { id } });
    await logAudit({ action: "submission_delete", entityType: "Submission", entityId: id, adminUserId: admin.id });
  } catch (err) {
    console.error("submission_delete_failed", err);
  }
  revalidatePath("/admin/submissions");
  redirect("/admin/submissions");
}

export async function setSubmissionStatus(formData: FormData) {
  const { admin } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "PENDING" && status !== "APPROVED" && status !== "REJECTED")) {
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }
  try {
    await prisma.submission.update({
      where: { id },
      data: { status, reviewedAt: status === "PENDING" ? null : new Date() },
    });
    await logAudit({
      action: "submission_set_status",
      entityType: "Submission",
      entityId: id,
      adminUserId: admin.id,
      metadata: { status },
    });
  } catch (err) {
    console.error("submission_set_status_failed", err);
  }
  revalidatePath("/admin/submissions");
  redirect("/admin/submissions");
}

export async function createPostFromSubmission(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = PostFromSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt"),
  });
  if (!parsed.success) {
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }

  try {
    const submission = await prisma.submission.findUnique({ where: { id: parsed.data.submissionId } });
    if (!submission) {
      revalidatePath("/admin/submissions");
      redirect("/admin/submissions");
    }

    const publishedAt =
      parsed.data.status === "PUBLISHED"
        ? parseDateTimeLocal(String(parsed.data.publishedAt ?? "")) ?? new Date()
        : undefined;

    const uniqueSlug = await ensureUniquePostSlug(parsed.data.slug);

    const created = await prisma.post.create({
      data: {
        title: parsed.data.title,
        slug: uniqueSlug,
        excerpt: parsed.data.excerpt || undefined,
        content: parsed.data.content,
        categoryId: parsed.data.categoryId || undefined,
        status: parsed.data.status,
        publishedAt,
        thumbnailPath: submission.thumbnailPath || undefined,
        videoPath: submission.videoPath || undefined,
        sourceSubmissionId: submission.id,
      },
      select: { id: true },
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    await logAudit({
      action: "submission_to_post",
      entityType: "Post",
      entityId: created.id,
      adminUserId: admin.id,
      metadata: { submissionId: submission.id },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin/posts");
    revalidatePath("/");
    redirect("/admin/posts");
  } catch (err) {
    console.error("submission_to_post_failed", err);
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }
}

export async function createPostFromMerged(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = PostFromMergedSchema.safeParse({
    submissionIds: formData.get("submissionIds"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt"),
  });
  if (!parsed.success) {
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }

  try {
    const ids = parsed.data.submissionIds
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (ids.length < 2) {
      revalidatePath("/admin/submissions");
      redirect("/admin/submissions");
    }

    const submissions = await prisma.submission.findMany({ where: { id: { in: ids } } });
    if (submissions.length < 2) {
      revalidatePath("/admin/submissions");
      redirect("/admin/submissions");
    }

    const publishedAt =
      parsed.data.status === "PUBLISHED"
        ? parseDateTimeLocal(String(parsed.data.publishedAt ?? "")) ?? new Date()
        : undefined;

    const uniqueSlug = await ensureUniquePostSlug(parsed.data.slug);

    const created = await prisma.post.create({
      data: {
        title: parsed.data.title,
        slug: uniqueSlug,
        excerpt: parsed.data.excerpt || undefined,
        content: parsed.data.content,
        categoryId: parsed.data.categoryId || undefined,
        status: parsed.data.status,
        publishedAt,
        thumbnailPath: submissions.find((s) => s.thumbnailPath)?.thumbnailPath || undefined,
        videoPath: submissions.find((s) => s.videoPath)?.videoPath || undefined,
        sourceSubmissionId: submissions[0]?.id,
      },
      select: { id: true },
    });

    await prisma.submission.updateMany({
      where: { id: { in: ids } },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    await logAudit({
      action: "submission_merge_to_post",
      entityType: "Post",
      entityId: created.id,
      adminUserId: admin.id,
      metadata: { submissionIds: ids },
    });
    revalidatePath("/admin/submissions");
    revalidatePath("/admin/posts");
    revalidatePath("/");
    redirect("/admin/posts");
  } catch (err) {
    console.error("submission_merge_to_post_failed", err);
    revalidatePath("/admin/submissions");
    redirect("/admin/submissions");
  }
}

"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";
import { logAudit } from "@/server/audit";

const PostCreateSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(1).max(140),
  excerpt: z.string().trim().max(240).optional().or(z.literal("")),
  content: z.string().trim().min(1).max(200000),
  categoryId: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  displaySlot: z.enum(["GRID", "FEATURED"]),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isPinned: z.coerce.boolean().default(false),
  publishedAt: z.string().optional().or(z.literal("")),
  thumbnailPath: z.string().trim().max(300).optional().or(z.literal("")),
});

const PostUpdateSchema = PostCreateSchema.extend({
  id: z.string().min(1),
});

function parseDateTimeLocal(value: string | undefined) {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export async function createPost(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = PostCreateSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    displaySlot: formData.get("displaySlot"),
    displayOrder: formData.get("displayOrder"),
    isPinned: formData.get("isPinned"),
    publishedAt: formData.get("publishedAt"),
    thumbnailPath: formData.get("thumbnailPath"),
  });
  if (!parsed.success) return;

  const publishedAt = parsed.data.status === "PUBLISHED" ? parseDateTimeLocal(String(parsed.data.publishedAt ?? "")) ?? new Date() : undefined;

  const created = await prisma.post.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || undefined,
      content: parsed.data.content,
      categoryId: parsed.data.categoryId || undefined,
      status: parsed.data.status,
      displaySlot: parsed.data.displaySlot,
      displayOrder: parsed.data.displayOrder,
      isPinned: parsed.data.isPinned,
      publishedAt,
      thumbnailPath: parsed.data.thumbnailPath || undefined,
    },
    select: { id: true },
  });

  await logAudit({ action: "post_create", entityType: "Post", entityId: created.id, adminUserId: admin.id });
}

export async function updatePost(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = PostUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    displaySlot: formData.get("displaySlot"),
    displayOrder: formData.get("displayOrder"),
    isPinned: formData.get("isPinned"),
    publishedAt: formData.get("publishedAt"),
    thumbnailPath: formData.get("thumbnailPath"),
  });
  if (!parsed.success) return;

  const publishedAt = parsed.data.status === "PUBLISHED" ? parseDateTimeLocal(String(parsed.data.publishedAt ?? "")) ?? new Date() : null;

  await prisma.post.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      categoryId: parsed.data.categoryId || null,
      status: parsed.data.status,
      displaySlot: parsed.data.displaySlot,
      displayOrder: parsed.data.displayOrder,
      isPinned: parsed.data.isPinned,
      publishedAt,
      thumbnailPath: parsed.data.thumbnailPath || null,
    },
  });

  await logAudit({ action: "post_update", entityType: "Post", entityId: parsed.data.id, adminUserId: admin.id });
}

export async function deletePost(formData: FormData) {
  const { admin } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.post.delete({ where: { id } });
  await logAudit({ action: "post_delete", entityType: "Post", entityId: id, adminUserId: admin.id });
}


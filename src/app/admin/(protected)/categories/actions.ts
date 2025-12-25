"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";
import { logAudit } from "@/server/audit";
import { DEFAULT_CATEGORIES } from "@/server/categories";

const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  slug: z.string().trim().min(1).max(40),
  order: z.coerce.number().int().min(0).max(9999).default(0),
});

const CategoryUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  slug: z.string().trim().min(1).max(40),
  order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createCategory(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = CategoryCreateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    order: formData.get("order"),
  });
  if (!parsed.success) return;

  const created = await prisma.category.create({
    data: { name: parsed.data.name, slug: parsed.data.slug, order: parsed.data.order },
    select: { id: true },
  });
  await logAudit({
    action: "category_create",
    entityType: "Category",
    entityId: created.id,
    adminUserId: admin.id,
  });
}

export async function updateCategory(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = CategoryUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    order: formData.get("order"),
  });
  if (!parsed.success) return;

  await prisma.category.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, slug: parsed.data.slug, order: parsed.data.order },
  });
  await logAudit({
    action: "category_update",
    entityType: "Category",
    entityId: parsed.data.id,
    adminUserId: admin.id,
  });
}

export async function deleteCategory(formData: FormData) {
  const { admin } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.category.delete({ where: { id } });
  await logAudit({ action: "category_delete", entityType: "Category", entityId: id, adminUserId: admin.id });
}

export async function seedDefaultCategories() {
  const { admin } = await requireAdmin();
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: c.order },
      create: c,
    });
  }
  await logAudit({
    action: "categories_seed_defaults",
    entityType: "Category",
    adminUserId: admin.id,
    metadata: { count: DEFAULT_CATEGORIES.length },
  });
}

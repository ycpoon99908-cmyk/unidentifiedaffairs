import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { DisplaySlot, PostStatus, PrismaClient, SubmissionStatus } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = url.startsWith("file:")
  ? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
  : new (PrismaClient as unknown as { new (opts: { errorFormat?: "minimal" | "colorless" | "pretty" }): PrismaClient })({
      errorFormat: "minimal",
    });

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: { username: adminUsername, passwordHash },
  });

  const categories = [
    { name: "都市傳說", slug: "urban-legends", order: 1 },
    { name: "靈異事件", slug: "paranormal", order: 2 },
    { name: "未解之謎", slug: "unsolved", order: 3 },
    { name: "禁忌檔案", slug: "forbidden", order: 4 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: c.order },
      create: c,
    });
  }

  const featuredCategory = await prisma.category.findUnique({ where: { slug: "urban-legends" } });

  const samplePosts = [
    {
      title: "午夜三點的電梯：按了不存在的樓層",
      slug: "elevator-3am",
      excerpt: "監視器裡的你，真的只有一個人嗎？",
      content:
        "那一晚我加班到凌晨。\n\n電梯門關上的瞬間，樓層按鍵自己亮起。\n\n我發誓：我沒有碰到那顆不存在的樓層。",
      status: PostStatus.PUBLISHED,
      displaySlot: DisplaySlot.FEATURED,
      displayOrder: 1,
      publishedAt: new Date(),
      categoryId: featuredCategory?.id,
    },
    {
      title: "廢棄醫院的第七張床單",
      slug: "hospital-sheet-seven",
      excerpt: "風聲像有人在數你呼吸的次數。",
      content:
        "你聽過嗎？那間醫院的七號病房，床單永遠是濕的。\n\n有人說是雨。\n\n有人說是血。\n\n只有夜班保全知道答案。",
      status: PostStatus.PUBLISHED,
      displaySlot: DisplaySlot.GRID,
      displayOrder: 2,
      publishedAt: new Date(),
    },
    {
      title: "你收到的那封信，其實不是給你的",
      slug: "wrong-letter",
      excerpt: "地址正確，收件人卻是你從未用過的名字。",
      content: "信封上寫著我的住址。\n\n但收件人不是我。\n\n那個名字，我只在夢裡聽過。",
      status: PostStatus.PUBLISHED,
      displaySlot: DisplaySlot.GRID,
      displayOrder: 3,
      publishedAt: new Date(),
    },
    {
      title: "那面鏡子只反射你想忘記的事",
      slug: "mirror-memory",
      excerpt: "你眨眼的瞬間，鏡子裡的你沒有。",
      content:
        "如果你在午夜看著鏡子超過七分鐘，\n\n鏡中會出現一段你沒經歷過的記憶。\n\n但它會讓你相信那是真的。",
      status: PostStatus.PUBLISHED,
      displaySlot: DisplaySlot.GRID,
      displayOrder: 4,
      publishedAt: new Date(),
    },
  ];

  for (const p of samplePosts) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p },
    });
  }

  await prisma.submission.createMany({
    data: [
      {
        title: "我家樓上每天凌晨都在拖椅子",
        content:
          "樓上早就沒人住了。\n\n但聲音每天準時出現。\n\n我把錄音發給朋友，朋友說：你錄到的不是椅子。",
        status: SubmissionStatus.PENDING,
        authorName: "匿名",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

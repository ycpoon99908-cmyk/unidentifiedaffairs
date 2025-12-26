import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { prisma } from "@/server/db";
import { HorrorVideoPlayer } from "@/components/HorrorVideoPlayer";
import { PostEngagement } from "./PostEngagement";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();

  let post:
    | {
        title: string;
        excerpt: string | null;
        content: string;
        thumbnailPath: string | null;
        videoPath: string | null;
        views: number;
        publishedAt: Date | null;
        category: { name: string; slug: string } | null;
        _count: { comments: number };
      }
    | null = null;

  try {
    post = await prisma.post.findFirst({
      where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
      select: {
        title: true,
        excerpt: true,
        content: true,
        thumbnailPath: true,
        videoPath: true,
        views: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    });
  } catch {
    return (
      <div className="min-h-dvh">
        <header className="border-b border-white/10 bg-black/15 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-sm tracking-[0.25em] text-white/70 hover:text-white">
              返回檔案室
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/submit" className="text-sm text-white/60 hover:text-white/85">
                投稿
              </Link>
              <Link href="/admin/login" className="text-sm text-white/60 hover:text-white/85">
                登入
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10">
          <div className="rounded-2xl border border-red-200/20 bg-red-950/20 p-6 text-sm text-red-100/80">
            伺服器尚未完成資料庫初始化（Vercel 環境變數或遷移未設定），暫時無法讀取文章內容。
          </div>
        </main>
      </div>
    );
  }

  if (!post) notFound();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm tracking-[0.25em] text-white/70 hover:text-white">
            返回檔案室
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/submit" className="text-sm text-white/60 hover:text-white/85">
              投稿
            </Link>
            <Link href="/admin/login" className="text-sm text-white/60 hover:text-white/85">
              登入
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10">
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/25 backdrop-blur">
          {post.videoPath ? (
            <div className="border-b border-white/10">
              <HorrorVideoPlayer src={post.videoPath} poster={post.thumbnailPath} title={post.title} />
            </div>
          ) : post.thumbnailPath ? (
            <div className="relative h-48 w-full overflow-hidden border-b border-white/10">
              <Image
                src={post.thumbnailPath}
                alt=""
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover opacity-80"
              />
              <div className="pointer-events-none absolute inset-0 crack" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>
          ) : (
            <div className="relative h-48 w-full overflow-hidden border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/25 to-black/50" />
              <div className="pointer-events-none absolute inset-0 crack" />
            </div>
          )}
          <div className="p-6">
            <div className="mb-2 text-[11px] tracking-[0.25em] text-white/45">{post.category?.name ?? "未知"}</div>
            <h1 className="text-2xl font-semibold leading-9 text-white/92">{post.title}</h1>
            {post.excerpt ? <p className="mt-3 text-sm leading-6 text-white/55">{post.excerpt}</p> : null}
            {post.publishedAt ? (
              <div className="mt-4 text-[11px] tracking-[0.18em] text-white/35">
                {new Intl.DateTimeFormat("zh-Hant", { dateStyle: "medium", timeStyle: "short" }).format(post.publishedAt)}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] tracking-[0.18em] text-white/35">
              <div>觀看：{post.views.toLocaleString("zh-Hant")}</div>
              <div>留言：{post._count.comments.toLocaleString("zh-Hant")}</div>
            </div>
          </div>
        </div>

        <article className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-6 text-white/80 backdrop-blur">
          <div className="prose prose-invert max-w-none break-words prose-p:leading-7 prose-a:break-words prose-a:text-red-200 prose-a:no-underline hover:prose-a:text-red-100 prose-pre:overflow-x-auto">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {post.content}
            </Markdown>
          </div>
        </article>

        <PostEngagement slug={slug} initialViews={post.views} initialCommentTotal={post._count.comments} />
      </main>
    </div>
  );
}

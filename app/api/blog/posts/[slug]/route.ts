import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, title: true, slug: true } },
        tags: { select: { id: true, title: true, slug: true } },
        author: { select: { firstName: true, lastName: true } },
      },
    });

    if (!post || post.status !== "PUBLISHED") {
      return ApiErr.notFound(MSG.blog.postNotFound);
    }

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "بلاگ", item: "/blog" },
        ...(post.category
          ? [{ "@type": "ListItem", position: 2, name: post.category.title, item: `/blog/category/${post.category.slug}` }]
          : []),
        { "@type": "ListItem", position: post.category ? 3 : 2, name: post.title },
      ],
    };

    const articleSchema =
      post.articleSchema ?? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        image: post.coverImage ?? undefined,
        datePublished: post.publishedAt,
        author: {
          "@type": "Person",
          name: [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ") || "ادمین",
        },
      };

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        category: post.category,
        tags: post.tags,
        author: [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ") || "ادمین",
      },
      seo: {
        metaTitle: post.metaTitle ?? post.title,
        metaDesc: post.metaDesc ?? post.excerpt,
        articleSchema,
        faqSchema: post.faqSchema ?? null,
        breadcrumbSchema: breadcrumb,
      },
    });
  } catch (err) {
    console.error("BLOG DETAIL ERROR", err);
    return ApiErr.internal();
  }
}

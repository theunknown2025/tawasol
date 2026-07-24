import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, NotebookPen } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import {
  PublicPagedListPagination,
  PublicPagedListToolbar,
  type PublicListViewMode,
  type PublicPageSize,
} from "@/components/public/PublicPagedListControls";
import { buildBlogShareUrl } from "@/lib/shareLinks";
import { fetchPublishedBlogPosts, type PublicBlogPost } from "@/lib/publicBlogsApi";
import { QUERY_KEY_PUBLIC_BLOGS } from "@/hooks/useBlogs";
import { Button } from "@/components/ui/button";

function formatPublishedDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogPostCard({ post }: { post: PublicBlogPost }) {
  const publishedLabel = formatPublishedDate(post.publishedAt);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link
        to={`/blog/${encodeURIComponent(post.slug)}`}
        className="block min-h-0 flex-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[16/9] w-full bg-muted">
          {post.banner?.trim() ? (
            <img src={post.banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <NotebookPen className="h-14 w-14 opacity-25" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h2 className="font-semibold leading-snug text-foreground">{post.title}</h2>
          {post.description.trim() ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
          ) : null}
          {publishedLabel ? (
            <p className="text-xs text-muted-foreground">{publishedLabel}</p>
          ) : null}
        </div>
      </Link>
      <div className="border-t border-border p-4 pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" className="w-full flex-1 gap-2 sm:w-auto" asChild>
            <Link to={`/blog/${encodeURIComponent(post.slug)}`}>
              <NotebookPen className="h-4 w-4" aria-hidden />
              Lire
            </Link>
          </Button>
          <ShareResourceMenu
            title={post.title}
            description={post.description?.trim() || undefined}
            url={buildBlogShareUrl(post.slug)}
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </div>
    </li>
  );
}

function BlogPostRow({ post }: { post: PublicBlogPost }) {
  const publishedLabel = formatPublishedDate(post.publishedAt);

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch">
      <Link
        to={`/blog/${encodeURIComponent(post.slug)}`}
        className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-muted outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:aspect-auto sm:h-28 sm:w-44"
      >
        {post.banner?.trim() ? (
          <img src={post.banner} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <NotebookPen className="h-10 w-10 opacity-25" aria-hidden />
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h2 className="text-lg font-semibold leading-snug text-foreground">{post.title}</h2>
          {publishedLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">{publishedLabel}</p>
          ) : null}
        </div>
        {post.description.trim() ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
        ) : null}
        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
          <Button type="button" className="w-full gap-2 sm:w-auto" asChild>
            <Link to={`/blog/${encodeURIComponent(post.slug)}`}>
              <NotebookPen className="h-4 w-4" aria-hidden />
              Lire
            </Link>
          </Button>
          <ShareResourceMenu
            title={post.title}
            description={post.description?.trim() || undefined}
            url={buildBlogShareUrl(post.slug)}
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </div>
    </li>
  );
}

export default function PublicBlogsPage() {
  const [viewMode, setViewMode] = useState<PublicListViewMode>("cards");
  const [pageSize, setPageSize] = useState<PublicPageSize>(9);
  const [page, setPage] = useState(0);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY_PUBLIC_BLOGS, "list-full"],
    queryFn: () => fetchPublishedBlogPosts(),
  });

  const totalCount = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return posts.slice(start, start + pageSize);
  }, [posts, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize, viewMode]);

  return (
    <PublicShell>
      <PublicPageHero
        title="Blog"
        description="Actualités et textes publiés par l’équipe REMESS : ouvrez un article pour lire le contenu complet."
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-10 lg:px-8">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Blog" }]} />

        {!isLoading && totalCount > 0 ? (
          <div className="flex justify-end">
            <PublicPagedListToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        ) : posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Aucun article de blog publié pour le moment.
          </p>
        ) : (
          <>
            {viewMode === "cards" ? (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {pageItems.map((post) => (
                  <BlogPostRow key={post.id} post={post} />
                ))}
              </ul>
            )}

            <PublicPagedListPagination
              page={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="article"
              ariaLabel="Pagination du blog"
            />
          </>
        )}
      </main>
    </PublicShell>
  );
}

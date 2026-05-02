import { Loader2, NotebookPen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePublishedBlogPosts } from "@/hooks/useBlogs";

type BlogsSectionProps = {
  /**
   * Quand un titre de section parent est déjà affiché (`LandingPageSectionOutlineTitle`),
   * masque l’en-tête interne pour éviter le doublon.
   */
  hidePageTitle?: boolean;
};

const HIGHLIGHT = 3;

function BlogCard({
  title,
  description,
  banner,
  slug,
}: {
  title: string;
  description: string;
  banner: string | null;
  slug: string;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link
        to={`/blog/${encodeURIComponent(slug)}`}
        className="block min-h-0 flex-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[16/9] w-full bg-muted">
          {banner?.trim() ? (
            <img src={banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <NotebookPen className="h-12 w-12 opacity-30" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{title}</h3>
          {description.trim() ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export function BlogsSection({ hidePageTitle = false }: BlogsSectionProps) {
  const { data: posts = [], isLoading } = usePublishedBlogPosts(HIGHLIGHT);

  return (
    <div
      className={`mx-auto max-w-6xl px-4 lg:px-8 ${hidePageTitle ? "pb-10 pt-0 md:pb-14" : "py-10 md:py-14"}`}
    >
      {!hidePageTitle ? (
        <header className="mb-8 text-center md:mb-10">
          <div className="mb-3 flex justify-center">
            <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <NotebookPen className="h-7 w-7 md:h-8 md:w-8" aria-hidden />
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Blog</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Les derniers articles publiés par l’équipe.
          </p>
        </header>
      ) : (
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground md:mb-10 md:text-base">
          Les derniers articles publiés par l’équipe.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        </div>
      ) : posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aucun article de blog publié pour l’instant.
        </p>
      ) : (
        <ul className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.id}>
              <BlogCard
                title={p.title}
                description={p.description}
                banner={p.banner}
                slug={p.slug}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center">
        <Button asChild size="lg" className="min-w-[14rem] gap-2">
          <Link to="/blogs">Tous les articles</Link>
        </Button>
      </div>
    </div>
  );
}

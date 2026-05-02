import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Loader2, NotebookPen, Star } from "lucide-react";
import { toast } from "sonner";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import { buildBlogShareUrl } from "@/lib/shareLinks";
import { fetchPublishedBlogBySlug, fetchPublishedBlogPosts } from "@/lib/publicBlogsApi";
import {
  fetchBlogComments,
  insertBlogComment,
  type BlogComment,
} from "@/lib/publicBlogCommentsApi";
import { QUERY_KEY_PUBLIC_BLOGS } from "@/hooks/useBlogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function commentsKey(blogId: string) {
  return ["blog-comments", blogId] as const;
}

function firstThreeWords(text: string): string {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  return words.join(" ");
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Note sur 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-md p-1 transition-colors hover:bg-muted ${n <= value ? "text-amber-500" : "text-muted-foreground/40"}`}
          aria-label={`${n} sur 5`}
        >
          <Star className={`h-7 w-7 ${n <= value ? "fill-current" : ""}`} aria-hidden />
        </button>
      ))}
    </div>
  );
}

function BlogCommentRow({ review }: { review: BlogComment }) {
  return (
    <li className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex text-amber-500">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`${review.id}-s-${i}`}
              className={`h-3.5 w-3.5 ${i < review.rating ? "fill-current" : "opacity-25"}`}
              aria-hidden
            />
          ))}
        </span>
        <span className="font-medium text-foreground">{review.author_name}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-foreground">{review.comment}</p>
    </li>
  );
}

export default function PublicBlogPage() {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam ? decodeURIComponent(slugParam) : "";
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: post, isLoading, isError } = useQuery({
    queryKey: [...QUERY_KEY_PUBLIC_BLOGS, "by-slug", slug],
    queryFn: () => fetchPublishedBlogBySlug(slug),
    enabled: slug.length > 0,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: commentsKey(post?.id ?? ""),
    queryFn: () => fetchBlogComments(post!.id),
    enabled: !!post?.id,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: [...QUERY_KEY_PUBLIC_BLOGS, "list-for-nav"],
    queryFn: () => fetchPublishedBlogPosts(),
    staleTime: 60_000,
  });

  const commentMutation = useMutation({
    mutationFn: insertBlogComment,
    onSuccess: async () => {
      toast.success("Merci pour votre avis");
      setName("");
      setEmail("");
      setRating(0);
      setComment("");
      await queryClient.invalidateQueries({ queryKey: commentsKey(post?.id ?? "") });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer le commentaire");
    },
  });

  if (isLoading) {
    return (
      <PublicShell>
        <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
      </PublicShell>
    );
  }

  if (isError || !post) {
    return (
      <PublicShell>
        <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
          <div className="space-y-4 py-12 text-center">
            <NotebookPen className="mx-auto h-12 w-12 text-muted-foreground opacity-40" aria-hidden />
            <h1 className="text-xl font-semibold text-foreground">Article introuvable</h1>
            <p className="text-sm text-muted-foreground">
              Ce contenu n’existe pas ou n’est plus publié.
            </p>
            <Button asChild variant="outline">
              <Link to="/blogs">Retour au blog</Link>
            </Button>
          </div>
        </main>
      </PublicShell>
    );
  }

  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const previousPost = currentIndex >= 0 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  return (
    <PublicShell>
      {post.banner?.trim() ? (
        <div className="relative left-1/2 w-screen max-w-[100vw] shrink-0 -translate-x-1/2 border-b border-border bg-muted">
          <img
            src={post.banner}
            alt=""
            className="block aspect-[21/9] max-h-[min(42vh,560px)] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25 p-4 text-white md:p-6">
            <div className="mx-auto flex h-full max-w-6xl flex-col justify-center gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
              <h1 className="max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">{post.title}</h1>
              {post.description.trim() ? (
                <p className="max-w-2xl text-sm leading-relaxed text-white/90 md:text-right md:text-base">
                  {post.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative left-1/2 w-screen max-w-[100vw] shrink-0 -translate-x-1/2 border-b border-border bg-gradient-to-r from-primary/30 via-primary/10 to-muted p-4 md:p-6">
          <div className="mx-auto flex min-h-[220px] max-w-6xl flex-col justify-center gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
            <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-foreground md:text-4xl">{post.title}</h1>
            {post.description.trim() ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-right md:text-base">
                {post.description}
              </p>
            ) : null}
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-8 md:py-10">
        <PublicBreadcrumbs
          items={[
            { label: "Accueil", to: "/" },
            { label: "Blog", to: "/blogs" },
            { label: post.title },
          ]}
        />
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {post.publishedAt ? (
              <p className="text-sm text-muted-foreground">
                Publié le{" "}
                {post.publishedAt.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
          <ShareResourceMenu
            title={post.title}
            description={post.description?.trim() || undefined}
            url={buildBlogShareUrl(post.slug)}
            variant="outline"
            size="default"
            className="shrink-0"
          />
        </div>

        <article className="space-y-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {post.content || "—"}
            </p>
          </div>
          <div className="grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-3 md:items-start">
            <div className="text-left">
              {previousPost ? (
                <Link to={`/blog/${encodeURIComponent(previousPost.slug)}`} className="group inline-block">
                  <p className="font-semibold text-foreground group-hover:text-primary">Article Précédent</p>
                  <p className="mt-1 text-muted-foreground group-hover:text-primary/80">
                    {firstThreeWords(previousPost.title)}
                  </p>
                </Link>
              ) : (
                <>
                  <p className="font-semibold text-muted-foreground">Article Précédent</p>
                  <p className="mt-1 text-muted-foreground/70">—</p>
                </>
              )}
            </div>

            <div className="text-left md:text-center">
              <Button asChild variant="ghost" className="px-0 md:px-3">
                <Link to="/blogs">Tous les articles</Link>
              </Button>
            </div>

            <div className="text-left md:text-right">
              {nextPost ? (
                <Link to={`/blog/${encodeURIComponent(nextPost.slug)}`} className="group inline-block">
                  <p className="font-semibold text-foreground group-hover:text-primary">Article Suivant</p>
                  <p className="mt-1 text-muted-foreground group-hover:text-primary/80">
                    {firstThreeWords(nextPost.title)}
                  </p>
                </Link>
              ) : (
                <>
                  <p className="font-semibold text-muted-foreground">Article Suivant</p>
                  <p className="mt-1 text-muted-foreground/70">—</p>
                </>
              )}
            </div>
          </div>
        </article>

        <section className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Avis ({comments.length})
            </h2>
            {commentsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Pas encore d’avis.</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((r) => (
                  <BlogCommentRow key={r.id} review={r} />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Votre avis
            </h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!post?.id) return;
                commentMutation.mutate({
                  blog_id: post.id,
                  author_name: name,
                  author_email: email,
                  rating,
                  comment,
                });
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="blog-comment-name">Nom</Label>
                  <Input
                    id="blog-comment-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-comment-email">Email</Label>
                  <Input
                    id="blog-comment-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-comment-comment">Commentaire</Label>
                <Textarea
                  id="blog-comment-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre avis…"
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={commentMutation.isPending}>
                {commentMutation.isPending ? "Envoi…" : "Publier l’avis"}
              </Button>
            </form>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

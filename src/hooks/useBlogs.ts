import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBlogs,
  fetchMyBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  type Blog,
  type CreateBlogInput,
} from "@/lib/blogsApi";

const QUERY_KEY_ALL = ["blogs", "all"] as const;
const QUERY_KEY_MINE = ["blogs", "mine"] as const;

type BlogsScope = "all" | "mine";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY_ALL });
  queryClient.invalidateQueries({ queryKey: QUERY_KEY_MINE });
}

export function useBlogs(scope: BlogsScope = "all") {
  const queryClient = useQueryClient();
  const queryKey = scope === "mine" ? QUERY_KEY_MINE : QUERY_KEY_ALL;
  const queryFn = scope === "mine" ? fetchMyBlogs : fetchBlogs;

  const { data: blogs = [], ...rest } = useQuery({
    queryKey,
    queryFn,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateBlogInput) => createBlog(input),
    onSuccess: () => invalidateAll(queryClient),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        description?: string;
        content?: string;
        banner?: string | null;
        status?: "draft" | "published";
      };
    }) => updateBlog(id, data),
    onSuccess: () => invalidateAll(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => invalidateAll(queryClient),
  });

  return {
    blogs,
    isLoading: rest.isLoading,
    error: rest.error,
    refetch: rest.refetch,

    addBlog: (input: CreateBlogInput) => createMutation.mutateAsync(input),
    updateBlog: (
      id: string,
      data: Parameters<typeof updateBlog>[1]
    ) => updateMutation.mutateAsync({ id, data }),
    deleteBlog: (id: string) => deleteMutation.mutateAsync(id),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { Blog };


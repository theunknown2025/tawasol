import type { LibraryBook } from "./types";

export type LibraryListViewMode = "cards" | "rows";

export function filterBooksBySearch(books: LibraryBook[], query: string): LibraryBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return books;
  return books.filter((b) => {
    const hay = `${b.title} ${b.author} ${b.keywords} ${b.description}`.toLowerCase();
    return q
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => hay.includes(token));
  });
}

export function visiblePageIndices(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const indices: number[] = [];
  const windowSize = 5;
  let start = Math.max(0, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = Math.max(0, end - windowSize + 1);
  }
  for (let i = start; i <= end; i++) indices.push(i);
  return indices;
}

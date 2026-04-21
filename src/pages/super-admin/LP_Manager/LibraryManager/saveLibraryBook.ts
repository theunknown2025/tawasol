import { createLibraryBook } from "./createLibraryBook";
import { editLibraryBook } from "./editLibraryBook";
import type { LibraryBook, LibraryBookInsert } from "./types";

/**
 * Crée ou met à jour selon la présence d’un `id`.
 */
export async function saveLibraryBook(
  payload: LibraryBookInsert & { id?: string },
): Promise<LibraryBook> {
  const id = payload.id?.trim();
  if (id) {
    return editLibraryBook({ ...payload, id });
  }
  const { id: _drop, ...rest } = payload;
  return createLibraryBook(rest);
}

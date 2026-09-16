import { createBilanDocument } from "./createBilanDocument";
import { editBilanDocument } from "./editBilanDocument";
import type { BilanDocument, BilanDocumentInsert } from "./types";

export async function saveBilanDocument(
  payload: BilanDocumentInsert & { id?: string },
): Promise<BilanDocument> {
  const id = payload.id?.trim();
  if (id) {
    return editBilanDocument({ ...payload, id });
  }
  const { id: _drop, ...rest } = payload;
  return createBilanDocument(rest);
}

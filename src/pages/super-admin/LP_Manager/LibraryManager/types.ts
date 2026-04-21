export type LibraryBook = {
  id: string;
  cover_url: string;
  pdf_url: string;
  title: string;
  author: string;
  description: string;
  keywords: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  /** Compteur public (RPC), défaut 0 si colonne absente avant migration */
  click_count?: number;
  download_count?: number;
};

export type LibraryBookInsert = {
  cover_url: string;
  pdf_url: string;
  title: string;
  author: string;
  description: string;
  keywords: string;
  is_published: boolean;
};

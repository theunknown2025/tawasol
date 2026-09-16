export type BilanDocument = {
  id: string;
  year: number;
  title: string;
  description: string;
  pdf_url: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  click_count?: number;
  download_count?: number;
};

export type BilanDocumentInsert = {
  year: number;
  title: string;
  description: string;
  pdf_url: string;
  is_published: boolean;
};

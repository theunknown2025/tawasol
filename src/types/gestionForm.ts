export type GestionFormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "date"
  | "select"
  | "checkbox";

export type GestionFormField = {
  id: string;
  label: string;
  type: GestionFormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type GestionFormStatus = "draft" | "published";

export type GestionForm = {
  id: string;
  title: string;
  description: string;
  banner: string;
  formDescription: string;
  fields: GestionFormField[];
  submitMessageEnabled: boolean;
  submitMessage: string;
  status: GestionFormStatus;
  createdAt: string;
  updatedAt: string;
};

export type GestionFormInput = Omit<GestionForm, "id" | "createdAt" | "updatedAt">;

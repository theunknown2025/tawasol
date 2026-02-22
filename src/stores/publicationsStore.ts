export interface Publication {
  id: string;
  text: string;
  files: { name: string; type: string; url: string }[];
  status: "draft" | "published";
  createdAt: Date;
  publishedAt?: Date;
  likes: number;
  clicks: number;
  comments: { id: string; author: string; text: string; createdAt: Date }[];
}

let publications: Publication[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getPublications() {
  return publications;
}

export function addPublication(pub: Omit<Publication, "id" | "createdAt" | "likes" | "comments" | "clicks">) {
  publications = [
    {
      ...pub,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      likes: 0,
      clicks: 0,
      comments: [],
    },
    ...publications,
  ];
  notify();
}

export function updatePublication(id: string, data: Partial<Publication>) {
  publications = publications.map((p) => (p.id === id ? { ...p, ...data } : p));
  notify();
}

export function deletePublication(id: string) {
  publications = publications.filter((p) => p.id !== id);
  notify();
}

export function toggleLike(id: string) {
  publications = publications.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p));
  notify();
}

export function incrementClicks(id: string) {
  publications = publications.map((p) => (p.id === id ? { ...p, clicks: p.clicks + 1 } : p));
  notify();
}

export function addComment(id: string, text: string) {
  publications = publications.map((p) =>
    p.id === id
      ? {
          ...p,
          comments: [
            ...p.comments,
            { id: crypto.randomUUID(), author: "Moi", text, createdAt: new Date() },
          ],
        }
      : p
  );
  notify();
}

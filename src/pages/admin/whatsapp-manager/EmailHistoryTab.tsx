import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

export type EmailSendHistoryRow = {
  id: string;
  publication_id: string | null;
  content_type: string | null;
  content_title: string | null;
  group_name: string;
  recipient_name: string;
  recipient_email: string;
  author_name: string;
  content_excerpt: string;
  publication_link: string;
  subject: string;
  sent_at: string;
};

const QUERY_KEY = ["email-notification-sends"] as const;

const TYPE_LABEL: Record<string, string> = {
  publication: "Publication",
  event: "Événement",
  project: "Projet",
  opportunity: "Opportunité",
  blog: "Article",
};

async function listSuccessfulSends(): Promise<EmailSendHistoryRow[]> {
  const { data, error } = await supabase
    .from("email_notification_sends")
    .select(
      "id, publication_id, content_type, content_title, group_name, recipient_name, recipient_email, author_name, content_excerpt, publication_link, subject, sent_at",
    )
    .order("sent_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []) as EmailSendHistoryRow[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function EmailHistoryTab() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listSuccessfulSends,
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-xl">
        Emails envoyés avec succès via Postfix/Dovecot (publications, événements, projets, opportunités, articles).
        Les échecs n’apparaissent pas ici.
      </p>

      {error && <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Erreur"}</p>}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead className="hidden md:table-cell">Groupe</TableHead>
              <TableHead>Contenu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>Chargement…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Aucun email envoyé pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const typeKey = r.content_type || "publication";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(r.sent_at)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TYPE_LABEL[typeKey] ?? typeKey}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{r.recipient_name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{r.recipient_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {r.group_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[280px]">
                      <span className="line-clamp-2">{r.content_title || r.content_excerpt || r.subject}</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

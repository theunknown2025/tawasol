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
import { listGreenApiMessageSends } from "./greenApiHistoryApi";

const QUERY_KEY = ["green-api-message-sends"] as const;

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manuel",
  notification: "Notification",
};

const TYPE_LABEL: Record<string, string> = {
  publication: "Publication",
  event: "Événement",
  opportunity: "Opportunité",
  blog: "Article",
  project: "Projet",
};

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

export default function GreenApiHistoryTab() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listGreenApiMessageSends,
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-xl">
        Historique des envois WhatsApp via Green API (messages manuels et notifications :
        publications, événements, articles, opportunités).
      </p>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Erreur"}
        </p>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="w-[110px]">Source</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[100px]">Statut</TableHead>
              <TableHead className="hidden md:table-cell">Groupe</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Chargement…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Aucun message envoyé pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(r.sent_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{SOURCE_LABEL[r.source] ?? r.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.content_type ? (
                      <Badge variant="outline">
                        {TYPE_LABEL[r.content_type] ?? r.content_type}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "sent" ? "default" : "destructive"}>
                      {r.status === "sent" ? "Envoyé" : "Échec"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {r.group_name || r.group_chat_id || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[320px]">
                    <span className="line-clamp-2">
                      {r.content_title || r.message_text || r.error_message || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

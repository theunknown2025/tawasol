import { Fragment, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCog, Eye, Loader2, Power, PowerOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/useUsers";
import { adminMemberDetailKey } from "@/hooks/useAdminMemberDetail";
import { adminSetProfileActive } from "@/lib/adminProfileApi";
import { ROLES, type Profile } from "@/lib/supabase";
import { AdminMemberExpandedPanel } from "./membres/AdminMemberExpandedPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-FR");

export default function GestionMembresPage() {
  const queryClient = useQueryClient();
  const { profiles, loading } = useUsers();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const admins = useMemo(
    () => profiles.filter((p) => p.role === ROLES.ADMIN).sort((a, b) => a.email.localeCompare(b.email)),
    [profiles]
  );

  const statusMutation = useMutation({
    mutationFn: ({ user_id, is_active }: { user_id: string; is_active: boolean }) =>
      adminSetProfileActive(user_id, is_active),
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      queryClient.invalidateQueries({ queryKey: adminMemberDetailKey(user_id) });
    },
  });

  const toggleExpanded = (userId: string) => {
    setExpandedUserId((cur) => (cur === userId ? null : userId));
  };

  const handleActivate = async (p: Profile) => {
    try {
      await statusMutation.mutateAsync({ user_id: p.user_id, is_active: true });
      toast.success("Compte activé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const handleDeactivate = async (p: Profile) => {
    try {
      await statusMutation.mutateAsync({ user_id: p.user_id, is_active: false });
      toast.success("Compte désactivé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-amber-500/10 p-2">
          <UserCog className="h-7 w-7 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des membres</h1>
          <p className="text-sm text-muted-foreground">
            Comptes administrateurs : aperçu dans le tableau, documents et activation.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrateurs</CardTitle>
          <CardDescription>
            Utilisez les icônes : activer, désactiver, ou afficher le détail (accordéon sous la ligne).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun administrateur pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="w-[148px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((p) => {
                  const active = p.is_active !== false;
                  const expanded = expandedUserId === p.user_id;
                  const rowBusy =
                    statusMutation.isPending && statusMutation.variables?.user_id === p.user_id;

                  return (
                    <Fragment key={p.user_id}>
                      <TableRow className={cn(expanded && "border-b-0")}>
                        <TableCell className="font-medium align-middle">{p.full_name ?? "—"}</TableCell>
                        <TableCell className="align-middle">{p.email}</TableCell>
                        <TableCell className="align-middle">
                          <Badge variant={active ? "secondary" : "destructive"}>
                            {active ? "Actif" : "Désactivé"}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-middle">{formatDate(p.created_at)}</TableCell>
                        <TableCell className="text-right align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                              disabled={active || rowBusy}
                              title="Activer le compte"
                              aria-label="Activer le compte"
                              onClick={() => void handleActivate(p)}
                            >
                              {rowBusy && !active ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              disabled={!active || rowBusy}
                              title="Désactiver le compte"
                              aria-label="Désactiver le compte"
                              onClick={() => void handleDeactivate(p)}
                            >
                              {rowBusy && active ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PowerOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-9 w-9",
                                expanded && "bg-primary/15 text-primary"
                              )}
                              title={expanded ? "Masquer l’aperçu" : "Aperçu du profil"}
                              aria-label={expanded ? "Masquer l’aperçu" : "Aperçu du profil"}
                              aria-expanded={expanded}
                              onClick={() => toggleExpanded(p.user_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow className="border-b hover:bg-muted/30">
                          <TableCell colSpan={5} className="p-0">
                            <div
                              className="border-t border-border bg-muted/20 px-4 py-5 md:px-6 animate-in fade-in slide-in-from-top-1 duration-200"
                              role="region"
                              aria-label={`Détail ${p.full_name ?? p.email}`}
                            >
                              <AdminMemberExpandedPanel member={p} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

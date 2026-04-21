import { useState } from "react";
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
import { Eye, Pencil, UserX, Trash2 } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { ROLE_LABELS, type Profile } from "@/lib/supabase";
import { ViewUserDialog } from "./ViewUserDialog";
import { EditUserDialog } from "./EditUserDialog";

const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-FR");

export function ListeUtilisateursTab() {
  const { profiles, loading, updateUser } = useUsers();
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [editUser, setEditUser] = useState<Profile | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des utilisateurs</CardTitle>
        <CardDescription>
          Utilisateurs créés dans la plateforme (Super Admin, Admin, Membre)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : profiles.length === 0 ? (
          <p className="text-muted-foreground">Aucun utilisateur pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tél</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.user_id}>
                  <TableCell>{p.full_name ?? "—"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.phone ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{p.address ?? "—"}</TableCell>
                  <TableCell>{ROLE_LABELS[p.role]}</TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Afficher"
                      onClick={() => setViewUser(p)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Modifier"
                      onClick={() => setEditUser(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Suspendre (à venir)"
                      className="text-amber-600 hover:text-amber-700"
                      onClick={() => {
                        // Placeholder: wiring backend suspend will be added later
                        alert("La suspension des comptes sera configurée ultérieurement.");
                      }}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Supprimer (à venir)"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        alert("La suppression de comptes sera configurée ultérieurement.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ViewUserDialog
        user={viewUser}
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
      />

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSave={updateUser}
      />
    </Card>
  );
}

import { useState } from "react";
import { Users, LayoutGrid, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersonnel } from "@/hooks/usePersonnel";
import type { Personnel, PersonnelFormData } from "@/types/personnel";
import {
  PersonnelSaveAction,
  PersonnelEditAction,
  PersonnelEditDialog,
  PersonnelPreviewAction,
  PersonnelDisplayDialog,
  PersonnelSuspendAction,
  PersonnelDeleteAction,
} from "./personnel";
import { Badge } from "@/components/ui/badge";

const EMPTY_FORM: PersonnelFormData = {
  full_name: "",
  phone: "",
  email: "",
  position: "",
  password: "",
  confirmPassword: "",
};

const POSITIONS = [
  "Chef de projet",
  "Développeur",
  "Designer",
  "Commercial",
  "Support",
  "Autre",
];

export default function GestionPersonnelPage() {
  const {
    personnel,
    loading,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    suspendPersonnel,
    fetchPersonnel,
  } = usePersonnel();
  const [activeTab, setActiveTab] = useState("nouveau");
  const [viewMode, setViewMode] = useState<"cards" | "rows">("cards");
  const [formData, setFormData] = useState<PersonnelFormData>(EMPTY_FORM);
  const [createAuthUser, setCreateAuthUser] = useState(false);
  const [editPersonnel, setEditPersonnel] = useState<Personnel | null>(null);
  const [previewPersonnel, setPreviewPersonnel] = useState<Personnel | null>(null);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setCreateAuthUser(false);
  };

  const handleSave = async (data: PersonnelFormData, withAuth: boolean) => {
    return createPersonnel(data, withAuth);
  };

  const handleEdit = (p: Personnel) => {
    setEditPersonnel(p);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <Users className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gestion Personnel</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="nouveau">Nouveau</TabsTrigger>
          <TabsTrigger value="liste">Liste personnel</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter un membre du personnel</CardTitle>
              <CardDescription>
                Remplissez les champs pour enregistrer un nouveau membre.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom Complet</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Tél</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="jean@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position || "_"}
                    onValueChange={(v) => setFormData((p) => ({ ...p, position: v === "_" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">Sélectionner</SelectItem>
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <Label className="text-base">Login</Label>
                <p className="text-sm text-muted-foreground">Login : email</p>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create_auth"
                    checked={createAuthUser}
                    onChange={(e) => setCreateAuthUser(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="create_auth">Créer un compte de connexion (email + mot de passe)</Label>
                </div>
                {createAuthUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmer mot de passe</Label>
                      <Input
                        id="confirm"
                        type="password"
                        value={formData.confirmPassword || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <PersonnelSaveAction
                data={formData}
                createAuthUser={createAuthUser}
                onSave={handleSave}
                onSuccess={resetForm}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="liste" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {personnel.length} membre{personnel.length !== 1 ? "s" : ""} du personnel
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "cards" ? "secondary" : "outline"}
                size="icon"
                onClick={() => setViewMode("cards")}
                title="Vue cartes"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "rows" ? "secondary" : "outline"}
                size="icon"
                onClick={() => setViewMode("rows")}
                title="Vue liste"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {personnel.map((p) => (
                <Card key={p.id} className={(p.is_suspended ?? false) ? "opacity-75" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{p.full_name}</CardTitle>
                      {(p.is_suspended ?? false) && (
                        <Badge variant="destructive" className="shrink-0">Suspendu</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.email}</p>
                    {p.position && <p className="text-sm">{p.position}</p>}
                  </CardHeader>
                  <CardFooter className="flex gap-1 pt-2">
                    <PersonnelPreviewAction personnel={p} onPreview={setPreviewPersonnel} />
                    <PersonnelEditAction personnel={p} onEdit={handleEdit} />
                    <PersonnelSuspendAction
                      personnel={p}
                      onSuspend={suspendPersonnel}
                      onSuspended={fetchPersonnel}
                    />
                    <PersonnelDeleteAction
                      personnel={p}
                      onDelete={deletePersonnel}
                      onDeleted={fetchPersonnel}
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tél</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((p) => (
                    <TableRow key={p.id} className={(p.is_suspended ?? false) ? "opacity-75" : ""}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.phone ?? "—"}</TableCell>
                      <TableCell>{p.position ?? "—"}</TableCell>
                      <TableCell>
                        {(p.is_suspended ?? false) ? (
                          <Badge variant="destructive">Suspendu</Badge>
                        ) : (
                          <Badge variant="secondary">Actif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <PersonnelPreviewAction personnel={p} onPreview={setPreviewPersonnel} />
                        <PersonnelEditAction personnel={p} onEdit={handleEdit} />
                        <PersonnelSuspendAction
                          personnel={p}
                          onSuspend={suspendPersonnel}
                          onSuspended={fetchPersonnel}
                        />
                        <PersonnelDeleteAction
                          personnel={p}
                          onDelete={deletePersonnel}
                          onDeleted={fetchPersonnel}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {personnel.length === 0 && !loading && (
            <p className="text-muted-foreground text-center py-8">Aucun personnel enregistré.</p>
          )}
        </TabsContent>
      </Tabs>

      <PersonnelDisplayDialog
        personnel={previewPersonnel}
        open={!!previewPersonnel}
        onOpenChange={(o) => !o && setPreviewPersonnel(null)}
      />

      <PersonnelEditDialog
        personnel={editPersonnel}
        open={!!editPersonnel}
        onOpenChange={(o) => !o && setEditPersonnel(null)}
        onSave={updatePersonnel}
        onSaved={fetchPersonnel}
      />
    </div>
  );
}

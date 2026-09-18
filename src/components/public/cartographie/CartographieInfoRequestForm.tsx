import { useMemo, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ClipboardList, Send } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitCartographieInfoRequest } from "@/pages/super-admin/LP_Manager/CartographieDemandes/cartographieInfoRequestApi";
import { CartographieRequestFiltersFields } from "@/pages/super-admin/LP_Manager/CartographieDemandes/CartographieRequestFiltersFields";
import {
  CARTOGRAPHIE_INFO_FIELD_OPTIONS,
  type CartographieInfoFieldKey,
  type CartographieInfoRequestFilters,
} from "@/pages/super-admin/LP_Manager/CartographieDemandes/cartographieInfoRequestTypes";

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  fonction: "",
  etablissement: "",
  usageDescription: "",
};

const emptyFilters: CartographieInfoRequestFilters = {
  activities: [],
  provinces: [],
  communes: [],
};

export default function CartographieInfoRequestForm() {
  const [form, setForm] = useState(emptyForm);
  const [requestedFields, setRequestedFields] = useState<CartographieInfoFieldKey[]>([]);
  const [filters, setFilters] = useState<CartographieInfoRequestFilters>(emptyFilters);

  const hasFilters = useMemo(
    () =>
      filters.activities.length > 0 ||
      filters.provinces.length > 0 ||
      filters.communes.length > 0,
    [filters],
  );

  const mutation = useMutation({
    mutationFn: submitCartographieInfoRequest,
    onSuccess: () => {
      toast.success("Votre demande a été envoyée. Vous serez contacté(e) par e-mail après validation.");
      setForm(emptyForm);
      setRequestedFields([]);
      setFilters(emptyFilters);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Impossible d'envoyer la demande.");
    },
  });

  const toggleField = (key: CartographieInfoFieldKey, checked: boolean) => {
    setRequestedFields((prev) => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((k) => k !== key);
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasFilters) {
      toast.error("Sélectionnez au moins une activité, province ou commune.");
      return;
    }
    mutation.mutate({
      ...form,
      requestedFields,
      filterActivities: filters.activities,
      filterProvinces: filters.provinces,
      filterCommunes: filters.communes,
    });
  };

  return (
    <Accordion type="single" collapsible defaultValue="demande" className="rounded-lg border border-border bg-card">
      <AccordionItem value="demande" className="border-b-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline sm:px-5">
          <span className="flex items-center gap-2 text-left text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            Demande d&apos;information — base de données des coopératives
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-5 sm:px-5">
          <p className="mb-4 text-sm text-muted-foreground">
            Remplissez ce formulaire pour demander l&apos;accès aux éléments d&apos;information des
            coopératives. Après validation, un fichier Excel filtré vous sera envoyé par e-mail.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="carto-demande-nom">Nom complet</Label>
                <Input
                  id="carto-demande-nom"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carto-demande-tel">Tél.</Label>
                <Input
                  id="carto-demande-tel"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carto-demande-email">Email</Label>
                <Input
                  id="carto-demande-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carto-demande-fonction">Fonction</Label>
                <Input
                  id="carto-demande-fonction"
                  required
                  value={form.fonction}
                  onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carto-demande-etablissement">Établissement</Label>
                <Input
                  id="carto-demande-etablissement"
                  required
                  value={form.etablissement}
                  onChange={(e) => setForm((f) => ({ ...f, etablissement: e.target.value }))}
                />
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Filtres de sélection</legend>
              <p className="text-xs text-muted-foreground">
                Sélectionnez une ou plusieurs activités, provinces et communes (après choix des
                provinces).
              </p>
              <CartographieRequestFiltersFields value={filters} onChange={setFilters} />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Éléments d&apos;information</legend>
              <p className="text-xs text-muted-foreground">
                Prière d&apos;indiquer les éléments d&apos;information demandés.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CARTOGRAPHIE_INFO_FIELD_OPTIONS.map((opt) => {
                  const checked = requestedFields.includes(opt.key);
                  const id = `carto-field-${opt.key}`;
                  return (
                    <label
                      key={opt.key}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2 rounded-md border border-border/80 px-3 py-2 text-sm hover:bg-muted/40"
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(v) => toggleField(opt.key, v === true)}
                        className="mt-0.5"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="carto-demande-usage">Description de l&apos;usage</Label>
              <Textarea
                id="carto-demande-usage"
                required
                rows={4}
                placeholder="Expliquez pourquoi vous avez besoin de ces informations…"
                value={form.usageDescription}
                onChange={(e) => setForm((f) => ({ ...f, usageDescription: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending} className="gap-2">
                <Send className="h-4 w-4" aria-hidden />
                {mutation.isPending ? "Envoi…" : "Envoyer la demande"}
              </Button>
            </div>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

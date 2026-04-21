import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  MessageCircle,
  Shield,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useUsers } from "@/hooks/useUsers";
import { useEvenements } from "@/hooks/useEvenements";
import { usePublications } from "@/hooks/usePublications";

type TimeBucket = {
  label: string;
  value: number;
};

function groupByDay<T extends { createdAt: Date }>(items: T[], days = 14): TimeBucket[] {
  const now = new Date();
  const buckets = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  items.forEach((item) => {
    const key = item.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  });

  return Array.from(buckets.entries()).map(([key, value]) => ({
    label: key.slice(5), // MM-DD
    value,
  }));
}

const activityChartConfig = {
  publications: {
    label: "Publications",
    color: "hsl(var(--chart-1))",
  },
  evenements: {
    label: "Événements",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const engagementChartConfig = {
  likes: {
    label: "Likes",
    color: "hsl(var(--chart-3))",
  },
  clicks: {
    label: "Clics",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export default function SuperAdminDashboardPage() {
  const { profiles, loading: loadingUsers } = useUsers();
  const { evenements, isLoading: loadingEvents } = useEvenements("all");
  const { publications, isLoading: loadingPublications } = usePublications("all");

  const totalUsers = profiles.length;
  const totalAdmins = profiles.filter((p) => (p as any).role === "admin").length;
  const totalSuperAdmins = profiles.filter((p) => (p as any).role === "super_admin").length;

  const totalPublications = publications.length;
  const totalEvents = evenements.length;

  const riskyEvents = evenements.filter((e) => e.status === "draft").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysPublications = publications.filter(
    (p) => p.createdAt.toISOString().slice(0, 10) === today,
  ).length;

  const totalLikes = publications.reduce((sum, p) => sum + p.likes, 0);
  const totalClicks = publications.reduce((sum, p) => sum + p.clicks, 0);

  const activitySeries = useMemo(() => {
    const pubSeries = groupByDay(publications);
    const evtSeries = groupByDay(evenements);
    return pubSeries.map((bucket, idx) => ({
      label: bucket.label,
      publications: bucket.value,
      evenements: evtSeries[idx]?.value ?? 0,
    }));
  }, [publications, evenements]);

  const engagementSeries = useMemo(
    () =>
      groupByDay(
        publications.map((p) => ({
          createdAt: p.createdAt,
          likes: p.likes,
          clicks: p.clicks,
        })) as Array<{ createdAt: Date; likes: number; clicks: number }>,
      ).map((bucket) => {
        const [year, month, day] = [
          new Date().getFullYear().toString(),
          bucket.label.slice(0, 2),
          bucket.label.slice(3, 5),
        ];
        const fullDate = new Date(`${year}-${month}-${day}`);
        const sameDay = publications.filter(
          (p) => p.createdAt.toISOString().slice(0, 10) === fullDate.toISOString().slice(0, 10),
        );
        return {
          label: bucket.label,
          likes: sameDay.reduce((sum, p) => sum + p.likes, 0),
          clicks: sameDay.reduce((sum, p) => sum + p.clicks, 0),
        };
      }),
    [publications],
  );

  const lastPublications = publications.slice(0, 5);
  const lastEvents = evenements.slice(0, 5);

  const loading = loadingUsers || loadingEvents || loadingPublications;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Shield className="text-amber-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Vue d&apos;ensemble en temps quasi réel de toute la plateforme.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Surveillance globale activée</span>
        </div>
      </div>

      {/* Band 1 – KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Utilisateurs</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Temps réel
              </span>
            </div>
            <CardDescription>
              Vue globale de tous les comptes et rôles sur la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight">{loading ? "…" : totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAdmins} admins · {totalSuperAdmins} super admins
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-500" />
                  Actifs élevés
                </span>
                <span className="flex items-center gap-1">
                  <UserMinus className="w-3 h-3 text-amber-500" />
                  Comptes à surveiller
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Publications & engagement</CardTitle>
              </div>
            </div>
            <CardDescription>Suivi des contenus, likes et clics.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? "…" : totalPublications}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {todaysPublications} créées aujourd&apos;hui
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {totalLikes.toLocaleString()} likes
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {totalClicks.toLocaleString()} clics
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Événements</CardTitle>
              </div>
            </div>
            <CardDescription>Ligne de temps des événements clés.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight">{loading ? "…" : totalEvents}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {riskyEvents} en brouillon · à confirmer
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              <p>Vision consolidée de tous les événements programmés.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">Radar d&apos;anomalies</CardTitle>
              </div>
            </div>
            <CardDescription>
              Mise en avant proactive des signaux faibles sur la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-amber-900 dark:text-amber-100 space-y-1.5">
            <p>
              Surveillez les pics de publications, la concentration d&apos;événements et les comptes
              inactifs prolongés.
            </p>
            <p className="opacity-80">
              Prochaine étape possible : détection automatique d&apos;anomalies propulsée par IA.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Band 2 – Activity & engagement charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="h-[360px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Activité globale</CardTitle>
                <CardDescription>Publications & événements sur les 14 derniers jours.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[300px]">
            {activitySeries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Les données d&apos;activité apparaîtront ici dès que des événements ou publications
                seront créés.
              </p>
            ) : (
              <ChartContainer config={activityChartConfig} className="h-full w-full aspect-auto">
                <LineChart data={activitySeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="publications"
                    stroke="var(--color-publications)"
                    strokeWidth={2}
                    dot={false}
                    name="Publications"
                  />
                  <Line
                    type="monotone"
                    dataKey="evenements"
                    stroke="var(--color-evenements)"
                    strokeWidth={2}
                    dot={false}
                    name="Événements"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="h-[360px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Engagement sur les contenus</CardTitle>
                <CardDescription>Likes & clics agrégés par jour.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[300px]">
            {engagementSeries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Les données d&apos;engagement apparaîtront ici au fur et à mesure des interactions.
              </p>
            ) : (
              <ChartContainer config={engagementChartConfig} className="h-full w-full aspect-auto">
                <BarChart data={engagementSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="likes" fill="var(--color-likes)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Band 3 – Timelines & live activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="h-[320px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Chronologie des événements</CardTitle>
                <CardDescription>Les prochains événements clés à ne pas manquer.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 space-y-3 overflow-y-auto max-h-[260px]">
            {lastEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun événement n&apos;est encore planifié. Créez un événement pour alimenter cette
                vue temporelle.
              </p>
            ) : (
              lastEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                >
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{evt.titre}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {evt.description || "Aucune description fournie."}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {evt.deadlineInscription
                          ? evt.deadlineInscription.toLocaleDateString()
                          : "Date à confirmer"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 capitalize">
                        Statut: {evt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-[320px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Flux d&apos;activité en direct</CardTitle>
                <CardDescription>
                  Dernières publications et signaux à fort impact pour le super admin.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 space-y-3 overflow-y-auto max-h-[260px]">
            {lastPublications.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Les prochaines publications apparaîtront ici dès qu&apos;elles seront créées.
              </p>
            ) : (
              lastPublications.map((pub) => (
                <div
                  key={pub.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                >
                  <div className="mt-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MessageCircle className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {pub.authorName}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{pub.text}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Clock className="w-3 h-3" />
                        {pub.createdAt.toLocaleDateString()}{" "}
                        {pub.createdAt.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {pub.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/5 text-primary px-2 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                      {(pub.likes > 0 || pub.clicks > 0) && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {pub.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {pub.clicks}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

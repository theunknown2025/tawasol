import MapPage from "./Barometre/MapPage";

export default function BarometrePage() {
  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cartographie</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualisez le Maroc par niveaux administratifs: regions, provinces et communes.
        </p>
      </div>
      <MapPage />
    </div>
  );
}

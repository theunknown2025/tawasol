import { Image } from "lucide-react";

export default function MediaManagerPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Image className="text-amber-600" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Media Manager</h1>
      </div>
      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-muted-foreground">Gérez vos médias, images et fichiers.</p>
      </div>
    </div>
  );
}

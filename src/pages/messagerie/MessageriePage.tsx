import { MessageSquare } from "lucide-react";

export default function MessageriePage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <MessageSquare className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Messagerie</h1>
      </div>
      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-muted-foreground">Vos conversations et messages.</p>
      </div>
    </div>
  );
}

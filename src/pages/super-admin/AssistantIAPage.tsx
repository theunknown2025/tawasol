import { Bot } from "lucide-react";

export default function AssistantIAPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Bot className="text-amber-600" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Assistant IA</h1>
      </div>
      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-muted-foreground">Assistant intelligent pour vous accompagner.</p>
      </div>
    </div>
  );
}

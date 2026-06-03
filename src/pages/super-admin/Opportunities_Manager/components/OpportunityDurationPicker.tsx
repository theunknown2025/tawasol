import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type OpportunityDurationPickerProps = {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  className?: string;
};

export default function OpportunityDurationPicker({
  start,
  end,
  onChange,
  className,
}: OpportunityDurationPickerProps) {
  const [open, setOpen] = useState(false);
  const from = start ? new Date(start) : undefined;
  const to = end ? new Date(end) : undefined;
  const range = from && to ? { from, to } : from ? { from, to: from } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !range && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {range?.from ? (
            range.to && range.to.getTime() !== range.from.getTime() ? (
              <>
                {format(range.from, "dd/MM/yyyy", { locale: fr })} –{" "}
                {format(range.to, "dd/MM/yyyy", { locale: fr })}
              </>
            ) : (
              format(range.from, "dd/MM/yyyy", { locale: fr })
            )
          ) : (
            "Du … au …"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            if (r?.from) {
              onChange(
                r.from.toISOString().slice(0, 10),
                r.to?.toISOString().slice(0, 10) ?? null,
              );
              if (r.from && r.to) setOpen(false);
            } else if (!r) {
              onChange(null, null);
            }
          }}
          locale={fr}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

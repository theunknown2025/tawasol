import { Check, ChevronsUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
  id?: string;
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
};

export function CartographieMultiSelect({
  id,
  label,
  placeholder,
  searchPlaceholder = "Rechercher…",
  emptyLabel = "Aucun résultat.",
  options,
  selected,
  onChange,
  disabled = false,
  disabledHint,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of options) map.set(opt.value, opt.label);
    return map;
  }, [options]);

  const toggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const remove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {selected.length > 0 ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            ({selected.length})
          </span>
        ) : null}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-auto min-h-10 w-full justify-between gap-2 px-3 py-2 font-normal"
          >
            <span className="truncate text-left text-sm text-muted-foreground">
              {disabled && disabledHint
                ? disabledHint
                : selected.length === 0
                  ? placeholder
                  : `${selected.length} sélectionné(s)`}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const checked = selectedSet.has(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => toggle(opt.value)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")}
                        aria-hidden
                      />
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 pr-1 font-normal">
              <span className="max-w-[14rem] truncate">{labelByValue.get(value) ?? value}</span>
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`Retirer ${labelByValue.get(value) ?? value}`}
                onClick={() => remove(value)}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

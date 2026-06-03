import { cn } from "@/lib/utils";
import { sanitizeRichTextHtml } from "./richTextUtils";

type RichTextContentProps = {
  html: string;
  className?: string;
};

export default function RichTextContent({ html, className }: RichTextContentProps) {
  const clean = sanitizeRichTextHtml(html);
  if (!clean) return null;

  return (
    <div
      className={cn(
        "rich-text-content whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

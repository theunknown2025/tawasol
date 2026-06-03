import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import ListKeymap from "@tiptap/extension-list-keymap";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { Bold, Italic, List, IndentIncrease } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RichTextFontSize, RICH_TEXT_FONT_SIZES } from "./richTextFontSizeExtension";

const TabIndent = Extension.create({
  name: "tabIndent",
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.sinkListItem("listItem");
        }
        return this.editor.commands.insertContent("    ");
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.liftListItem("listItem");
        }
        return false;
      },
    };
  },
});

const TEXT_COLORS = [
  { label: "Noir", value: "#111827" },
  { label: "Gris", value: "#6b7280" },
  { label: "Vert", value: "#059669" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Rouge", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
] as const;

type RichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Saisissez la description…",
  className,
  minHeight = "160px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      RichTextFontSize,
      ListKeymap,
      TabIndent,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        class: "rich-text-editor__body outline-none",
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-md border border-input bg-background",
          className,
        )}
        style={{ minHeight }}
      />
    );
  }

  const activeFontSize =
    RICH_TEXT_FONT_SIZES.find((s) => editor.isActive("textStyle", { fontSize: s.value }))?.value ??
    "";

  return (
    <div className={cn("rich-text-editor overflow-hidden rounded-md border border-input bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5">
        <Toggle
          type="button"
          size="sm"
          variant="outline"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Gras"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          type="button"
          size="sm"
          variant="outline"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italique"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          type="button"
          size="sm"
          variant="outline"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 px-2.5"
          onClick={() => {
            if (editor.isActive("listItem")) {
              editor.chain().focus().sinkListItem("listItem").run();
            } else {
              editor.chain().focus().insertContent("    ").run();
            }
          }}
          aria-label="Tabulation / indentation"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>

        <Select
          value={activeFontSize || undefined}
          onValueChange={(size) => {
            editor.chain().focus().setFontSize(size).run();
          }}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue placeholder="Taille" />
          </SelectTrigger>
          <SelectContent>
            {RICH_TEXT_FONT_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border-l border-border pl-1.5">
          {TEXT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              className={cn(
                "h-6 w-6 rounded border border-border transition-transform hover:scale-110",
                editor.isActive("textStyle", { color: color.value }) && "ring-2 ring-primary ring-offset-1",
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => editor.chain().focus().setColor(color.value).run()}
            />
          ))}
          <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded border border-border bg-background">
            <span className="text-[10px] font-bold text-muted-foreground">+</span>
            <input
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>
        </div>
      </div>

      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  );
}

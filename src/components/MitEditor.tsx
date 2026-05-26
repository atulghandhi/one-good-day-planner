import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  /** Called when user presses Enter on the LAST line with the editor empty-ish or done — used to advance focus. */
  onAdvance?: () => void;
  done?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

export function MitEditor({
  value,
  onChange,
  onBlur,
  onAdvance,
  done = false,
  placeholder = "What would make today a win?",
  autoFocus,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        strike: false,
        italic: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !done,
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: cn(
          "mit-prose w-full bg-card text-[color:var(--mit-foreground)] outline-none transition-all",
          "rounded-[1.5rem] border border-border/60 shadow-soft",
          "px-5 py-3 my-6 t-body-lg",
          "focus:shadow-pop focus:-translate-y-[1px] focus:ring-4 focus:ring-[color:var(--mit)]/60",
          done && "line-through text-muted-foreground/70 bg-muted/40 shadow-none",
        ),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          // Plain Enter — advance to sub-step instead of inserting newline.
          event.preventDefault();
          onAdvance?.();
          return true;
        }
        if (event.key === "Tab" && !event.shiftKey) {
          event.preventDefault();
          onAdvance?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
    onBlur: () => onBlur?.(),
  });

  // Keep external value in sync (e.g. after reset).
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!done);
  }, [done, editor]);

  if (!editor) {
    return <div className="h-[60px] my-6 rounded-[1.5rem] bg-card/40" />;
  }

  return (
    <div className="mit-editor relative">
      <EditorContent editor={editor} />
    </div>
  );
}

/** Returns true if the HTML has any visible text content. */
export function mitHasContent(html: string): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length > 0;
}

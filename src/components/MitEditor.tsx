import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  List,
  Quote,
  Code,
  Code2,
} from "lucide-react";
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

function isPlainSingleLine(editor: Editor): boolean {
  // Toolbar shows once the user breaks out of a single plain paragraph,
  // either by adding length that wraps OR by using formatting/blocks.
  const json = editor.getJSON();
  const content = json.content ?? [];
  if (content.length !== 1) return false;
  const first = content[0];
  if (first.type !== "paragraph") return false;
  // Any marks present? -> already rich
  const hasMarks = (first.content ?? []).some(
    (n) => Array.isArray(n.marks) && n.marks.length > 0,
  );
  if (hasMarks) return false;
  return true;
}

export function MitEditor({
  value,
  onChange,
  onBlur,
  onAdvance,
  done = false,
  placeholder = "What would make today a win?",
  autoFocus,
}: Props) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [wrapped, setWrapped] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !done,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: cn(
          "mit-prose w-full bg-card text-card-foreground outline-none transition-all",
          "rounded-[1.5rem] border border-border/60 shadow-soft",
          "px-5 py-3 my-6 text-base font-display tracking-tight",
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
      // Hide toolbar only while content is a single short plain line.
      const dom = editor.view.dom as HTMLElement;
      const isMultiBlock = (editor.getJSON().content?.length ?? 0) > 1;
      const looksWrapped = dom.scrollHeight > 64 || isMultiBlock;
      setWrapped(looksWrapped);
      if (!isPlainSingleLine(editor) || looksWrapped) {
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
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
      {showToolbar && !done && (
        <div
          className={cn(
            "mit-toolbar pointer-events-auto -mt-3 mb-4 mx-2 flex items-center gap-0.5 rounded-full",
            "border border-border/50 bg-card/85 backdrop-blur px-1.5 py-1 shadow-soft w-fit",
            "transition-opacity duration-200",
            wrapped ? "opacity-100" : "opacity-80",
          )}
          // Avoid stealing focus when clicking buttons.
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarBtn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
          >
            <BoldIcon className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
          >
            <ItalicIcon className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <Sep />
          <ToolbarBtn
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            label="Quote"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <Sep />
          <ToolbarBtn
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            label="Inline code"
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            label="Code block"
          >
            <Code2 className="h-3.5 w-3.5" />
          </ToolbarBtn>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full transition-colors",
        active
          ? "bg-[color:var(--mit)]/80 text-[color:var(--mit-foreground)]"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-border/70" aria-hidden />;
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

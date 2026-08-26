import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { countHtmlTextLength } from "@repo/utilities/security/dom-purify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editorTestId?: string;
  maxLength?: number | null;
  onLimitExceeded?: (isExceeded: boolean) => void;
  className?: string;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  editorTestId,
  maxLength,
  onLimitExceeded,
  className,
}: RichTextEditorProps) => {
  const [charCount, setCharCount] = useState(0);

  const isExceeded = !!maxLength && charCount > maxLength;

  // Stable ref so the exceeded-notification effect doesn't need onLimitExceeded as a dep
  const onLimitExceededRef = useRef(onLimitExceeded);
  onLimitExceededRef.current = onLimitExceeded;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        hardBreak: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const textLength = countHtmlTextLength(html);
      setCharCount(textLength);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm min-h-[200px] p-3 text-sm focus:outline-none wrap-break-word ${className}`,
        "data-testid": editorTestId || "",
      },
    },
  });

  // Sync editor when value prop changes externally (e.g., modal reopen, discard).
  // emitUpdate: false prevents onUpdate from firing and calling onChange redundantly.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      setCharCount(countHtmlTextLength(value));
    }
  }, [value, editor]);

  // Initialize character count on mount only — the effect above already
  // keeps it in sync reactively whenever `value` changes afterward.
  useEffect(() => {
    if (value) {
      setCharCount(countHtmlTextLength(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent whenever the exceeded state flips
  useEffect(() => {
    onLimitExceededRef.current?.(isExceeded);
  }, [isExceeded]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <div className="border-border focus-within:ring-ring rounded-md border focus-within:ring-1 focus-within:ring-inset">
        {/* Toolbar */}
        <div className="border-border bg-muted/30 flex items-center gap-1 border-b p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive("bold") ? "bg-slate-900/10" : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive("italic") ? "bg-slate-900/10" : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="bg-border mx-1 h-5 w-px" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive("bulletList") ? "bg-slate-900/10" : ""}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-slate-900/10" : ""}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        {/* Styles */}
        <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror li {
          margin-top: 0.125rem;
          margin-bottom: 0.125rem;
        }

        .ProseMirror strong {
          font-weight: 600;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror:focus {
          outline: none;
        }
      `}</style>
      </div>
      {maxLength && (
        <div className="space-y-1">
          <p
            className={`text-right text-xs ${isExceeded ? "text-amber-500" : "text-muted-foreground"}`}
          >
            {charCount}/{maxLength}
          </p>
          {isExceeded && (
            <p className="text-sm text-amber-500">
              Body can not be longer than {maxLength} characters
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default RichTextEditor;

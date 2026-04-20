import { useEffect, useRef } from "react";
import { Bold, Type } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
}

function normalizeEditorHtml(html: string): string {
  if (!html) return "";
  const trimmed = html.trim();
  if (trimmed === "<br>" || trimmed === "<div><br></div>") return "";
  return trimmed;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = "min-h-32",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emitValue = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(normalizeEditorHtml(el.innerHTML));
  };

  const runCommand = (command: "bold" | "removeFormat") => {
    editorRef.current?.focus();
    document.execCommand(command);
    emitValue();
  };

  const isEmpty = normalizeEditorHtml(value).length === 0;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <button
          type="button"
          onClick={() => runCommand("bold")}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
          title="In đậm"
        >
          <Bold className="h-4 w-4" />
          <span>B</span>
        </button>
        <button
          type="button"
          onClick={() => runCommand("removeFormat")}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
          title="Chữ thường"
        >
          <Type className="h-4 w-4" />
          <span>Thường</span>
        </button>
      </div>

      <div className="relative">
        {isEmpty && placeholder ? (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-gray-400">
            {placeholder}
          </div>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitValue}
          className={`${minHeightClassName} w-full px-4 py-3 text-sm leading-7 text-gray-900 focus:outline-none`}
        />
      </div>
    </div>
  );
}

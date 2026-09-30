"use client";

import { EyeOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeMaskedRanges, type TextRange } from "../lib/study-feed";

type Document = { text: string; ranges: TextRange[] };
type Caret = TextRange & { masked: boolean };
type Snapshot = Document & { caret: Caret };

type MaskedTextEditorProps = {
  onChange: (text: string, ranges: TextRange[]) => void;
  toolbar: HTMLDivElement | null;
};

// Each span has an anchor so boundary carets sit inside its text node,
// including the start of a mask. This prefix never belongs to the document.
const ANCHOR = "\u200b";

function readDocument(root: Node): Document {
  let text = "";
  const ranges: TextRange[] = [];
  function visit(node: Node, masked = false, anchor = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? "";
      const content = anchor && value.startsWith(ANCHOR) ? value.slice(1) : value;
      const start = text.length;
      text += content;
      if (masked && content) ranges.push({ start, end: text.length });
      return;
    }
    const element = node instanceof HTMLElement ? node : null;
    if (element?.dataset.editorTail === "true") return;
    // Enter and paste insert literal newlines. Browser-created BRs after
    // deleting the last character are only contenteditable placeholders.
    if (element?.tagName === "BR") return;
    const isMask = masked || element?.dataset.mask === "true";
    const hasAnchor = element?.dataset.anchor === "true";
    node.childNodes.forEach((child, index) => visit(child, isMask, hasAnchor && index === 0));
  }
  visit(root);
  return { text, ranges: normalizeMaskedRanges(ranges, text.length) };
}

function selectionIn(root: HTMLElement): Caret | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const offset = (node: Node, position: number) => {
    const prefix = document.createRange();
    prefix.selectNodeContents(root);
    prefix.setEnd(node, position);
    return readDocument(prefix.cloneContents()).text.length;
  };
  const element = range.startContainer instanceof Element
    ? range.startContainer
    : range.startContainer.parentElement;
  return {
    start: offset(range.startContainer, range.startOffset),
    end: offset(range.endContainer, range.endOffset),
    masked: Boolean(element?.closest('[data-mask="true"]')),
  };
}

function renderDocument(root: HTMLElement, value: Document, caret: Caret) {
  const fragment = document.createDocumentFragment();
  const pieces: { node: Text; start: number; end: number; masked: boolean; prefix: number }[] = [];
  function append(start: number, end: number, masked: boolean) {
    const span = document.createElement("span");
    span.dataset.anchor = "true";
    if (masked) {
      span.dataset.mask = "true";
      span.className = "mx-1 rounded-[4px] bg-danger/10 px-1 text-danger ring-1 ring-danger/20 [box-decoration-break:clone]";
    }
    const prefix = 1;
    const node = document.createTextNode(ANCHOR + value.text.slice(start, end));
    span.appendChild(node);
    fragment.appendChild(span);
    pieces.push({ node, start, end, masked, prefix });
  }
  const hasMaskedCaret =
    caret.masked &&
    caret.start === caret.end &&
    !value.ranges.some((range) => range.start <= caret.start && caret.start <= range.end);
  function appendPlain(start: number, end: number) {
    if (hasMaskedCaret && start <= caret.start && caret.start <= end) {
      append(start, caret.start, false);
      append(caret.start, caret.start, true);
      append(caret.start, end, false);
      return;
    }
    append(start, end, false);
  }
  let position = 0;
  for (const range of value.ranges) {
    appendPlain(position, range.start);
    append(range.start, range.end, true);
    position = range.end;
  }
  appendPlain(position, value.text.length);
  // Keep a final newline visible/selectable; otherwise contenteditable treats
  // it as layout-only and Ctrl+A can leave that newline behind.
  const tail = document.createElement("span");
  tail.dataset.editorTail = "true";
  tail.contentEditable = "false";
  tail.setAttribute("aria-hidden", "true");
  tail.textContent = ANCHOR;
  fragment.appendChild(tail);
  root.replaceChildren(fragment);
  const point = (offset: number, masked: boolean) => {
    const candidates = pieces.filter((piece) => piece.start <= offset && piece.end >= offset);
    const piece = candidates.find((candidate) => candidate.masked === masked) ?? candidates[0];
    return { node: piece.node, offset: offset - piece.start + piece.prefix };
  };
  const start = point(Math.min(caret.start, value.text.length), caret.masked);
  const end = point(Math.min(caret.end, value.text.length), caret.masked);
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  updateCaretColor(root);
}

function updateCaretColor(root: HTMLElement) {
  const caret = selectionIn(root);
  root.style.caretColor = caret?.masked ? "var(--color-danger)" : "";
}

export function MaskedTextEditor({
  onChange,
  toolbar,
}: MaskedTextEditorProps) {
  const editor = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const current = useRef<Document>({ text: "", ranges: [] });
  const insertTextRef = useRef<(text: string) => void>(() => {});
  const history = useRef<Snapshot[]>([{ text: "", ranges: [], caret: { start: 0, end: 0, masked: false } }]);
  const historyIndex = useRef(0);
  const selectedRange = useRef<Caret | null>(null);
  const [selection, setSelection] = useState<Caret | null>(null);
  const [empty, setEmpty] = useState(true);

  function publish(value: Document, caret: Caret, record = true) {
    current.current = value;
    if (record) {
      history.current = history.current.slice(0, historyIndex.current + 1);
      history.current.push({ ...value, caret });
      historyIndex.current += 1;
    }
    setEmpty(!value.text);
    selectedRange.current = caret.start < caret.end ? caret : null;
    setSelection(caret.start < caret.end ? caret : null);
    onChange(value.text, value.ranges);
  }

  function commit() {
    const root = editor.current;
    if (!root || composing.current) return;
    const caret = selectionIn(root);
    if (!caret) return;
    const value = readDocument(root);
    renderDocument(root, value, caret);
    publish(value, caret);
  }

  function insertText(text: string) {
    const root = editor.current;
    const caret = root && selectionIn(root);
    if (!root || !caret) return;
    const { start, end } = caret;
    const value = current.current;
    const removed = end - start;
    const afterDeletion = normalizeMaskedRanges(
      value.ranges.map((range) => ({
        start: range.start <= start ? range.start : Math.max(start, range.start - removed),
        end: range.end <= start ? range.end : Math.max(start, range.end - removed),
      })),
      value.text.length - removed,
    );
    const maskedIndex = caret.masked
      ? afterDeletion.findIndex((range) => range.start <= start && start <= range.end)
      : -1;
    const ranges = afterDeletion.map((range, index) => {
      if (index === maskedIndex) return { start: range.start, end: range.end + text.length };
      if (range.start >= start) return { start: range.start + text.length, end: range.end + text.length };
      if (range.end > start) return { start: range.start, end: range.end + text.length };
      return range;
    });
    if (caret.masked && maskedIndex === -1 && text) ranges.push({ start, end: start + text.length });
    const nextText = value.text.slice(0, start) + text + value.text.slice(end);
    const next = { text: nextText, ranges: normalizeMaskedRanges(ranges, nextText.length) };
    const nextCaret = { start: start + text.length, end: start + text.length, masked: caret.masked };
    renderDocument(root, next, nextCaret);
    publish(next, nextCaret);
  }

  function addMask(range: Caret) {
    const root = editor.current;
    if (!root) return;
    const value = {
      ...current.current,
      ranges: normalizeMaskedRanges(
        [...current.current.ranges, range],
        current.current.text.length,
      ),
    };
    const caret = { start: range.end, end: range.end, masked: true };
    renderDocument(root, value, caret);
    root.focus();
    publish(value, caret);
    if (range.start === range.end) setEmpty(false);
  }

  function addSelectedMask() {
    const root = editor.current;
    const liveRange = root && selectionIn(root);
    const range =
      liveRange ??
      selection ??
      selectedRange.current ?? {
        start: current.current.text.length,
        end: current.current.text.length,
        masked: false,
      };
    addMask(range);
  }

  useEffect(() => {
    insertTextRef.current = insertText;
  });

  function undo(redo: boolean) {
    const index = historyIndex.current + (redo ? 1 : -1);
    const snapshot = history.current[index];
    if (!snapshot || !editor.current) return;
    historyIndex.current = index;
    renderDocument(editor.current, snapshot, snapshot.caret);
    publish(snapshot, snapshot.caret, false);
  }

  function deleteText(backward: boolean) {
    const root = editor.current;
    const caret = root && selectionIn(root);
    if (!root || !caret) return;
    let { start, end } = caret;
    const value = current.current;
    if (start === end) {
      const segments = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value.text)];
      if (backward) {
        start = segments.findLast((segment) => segment.index < start)?.index ?? start;
      } else {
        end = segments.find((segment) => segment.index > end)?.index ?? value.text.length;
      }
    }
    if (start === end) return;
    const delta = end - start;
    const map = (offset: number) => offset <= start ? offset : offset < end ? start : offset - delta;
    const text = value.text.slice(0, start) + value.text.slice(end);
    const next = { text, ranges: normalizeMaskedRanges(value.ranges.map((range) => ({ start: map(range.start), end: map(range.end) })), text.length) };
    const nextCaret = { start, end: start, masked: caret.masked };
    renderDocument(root, next, nextCaret);
    publish(next, nextCaret);
  }

  useEffect(() => {
    const root = editor.current;
    if (!root) return;
    renderDocument(root, current.current, { start: 0, end: 0, masked: false });
    root.focus();
    const updateSelection = () => {
      if (composing.current) return;
      const caret = selectionIn(root);
      updateCaretColor(root);
      const nextSelection = caret && caret.start < caret.end ? caret : null;
      if (nextSelection) selectedRange.current = nextSelection;
      setSelection(nextSelection);
    };
    const handleBeforeInput = (event: InputEvent) => {
      if (event.isComposing || composing.current) return;
      if (event.inputType === "insertText" && event.data !== null) {
        event.preventDefault();
        insertTextRef.current(event.data);
      } else if (event.inputType === "insertParagraph" || event.inputType === "insertLineBreak") {
        event.preventDefault();
        insertTextRef.current("\n");
      }
    };
    document.addEventListener("selectionchange", updateSelection);
    root.addEventListener("beforeinput", handleBeforeInput);
    return () => {
      document.removeEventListener("selectionchange", updateSelection);
      root.removeEventListener("beforeinput", handleBeforeInput);
    };
  }, []);

  return (
    <>
      <div className="relative flex-1">
      {empty && <div aria-hidden="true" className="pointer-events-none absolute text-lg leading-[1.6] text-muted dark:text-muted-dark">学びたい知識を入力…</div>}
      <div
        ref={editor}
        role="textbox"
        aria-label="学びたい知識を入力"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className="min-h-[32vh] w-full border-0 bg-transparent text-lg leading-[1.6] whitespace-pre-wrap wrap-anywhere text-ink caret-ink outline-none dark:text-ink-dark dark:caret-ink-dark"
        onInput={commit}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; commit(); }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) return;
          if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y")) {
            event.preventDefault();
            undo(event.shiftKey || event.key.toLowerCase() === "y");
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            insertText("\n");
            return;
          }
          if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            deleteText(event.key === "Backspace");
            return;
          }
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          const root = editor.current;
          const caret = root && selectionIn(root);
          if (!root || !caret || caret.start !== caret.end) return;
          const right = event.key === "ArrowRight";
          const boundary = current.current.ranges.some((range) =>
            (right === caret.masked ? range.end : range.start) === caret.start,
          );
          if (boundary) {
            event.preventDefault();
            renderDocument(root, current.current, { ...caret, masked: !caret.masked });
            return;
          }

          const segments = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(current.current.text)];
          const next = right
            ? segments.find((segment) => segment.index > caret.start)?.index ?? current.current.text.length
            : segments.findLast((segment) => segment.index < caret.start)?.index ?? 0;
          event.preventDefault();
          renderDocument(root, current.current, { start: next, end: next, masked: caret.masked });
        }}
        onPaste={(event) => {
          event.preventDefault();
          insertText(event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n"));
        }}
        onCopy={(event) => {
          const caret = editor.current && selectionIn(editor.current);
          if (!caret) return;
          event.preventDefault();
          event.clipboardData.setData("text/plain", current.current.text.slice(caret.start, caret.end));
        }}
        onCut={(event) => {
          const caret = editor.current && selectionIn(editor.current);
          if (!caret) return;
          event.preventDefault();
          event.clipboardData.setData("text/plain", current.current.text.slice(caret.start, caret.end));
          insertText("");
        }}
        onDrop={(event) => event.preventDefault()}
      />
      {selection && (
        <button
          type="button"
          className="absolute right-2 bottom-2 z-5 flex cursor-pointer items-center gap-1.5 rounded-popover border border-ink-dark bg-ink px-3.5 py-2 text-caption font-bold text-white shadow-card-menu before:absolute before:-bottom-1.5 before:right-5 before:size-3 before:rotate-45 before:border-r before:border-b before:border-ink-dark before:bg-ink dark:border-line-dark dark:bg-ink-dark dark:text-black dark:before:border-line-dark dark:before:bg-ink-dark"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => addMask(selection)}
        >
          <EyeOffIcon size={17} />目隠しを設定
        </button>
      )}
      </div>
      {toolbar &&
        createPortal(
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent text-ink dark:text-ink-dark"
            title="目隠しブロックを追加"
            aria-label="目隠しブロックを追加"
            onMouseDown={(event) => {
              event.preventDefault();
              addSelectedMask();
            }}
            onClick={(event) => {
              if (event.detail === 0) addSelectedMask();
            }}
          >
            <EyeOffIcon size={20} />
          </button>,
          toolbar,
        )}
    </>
  );
}

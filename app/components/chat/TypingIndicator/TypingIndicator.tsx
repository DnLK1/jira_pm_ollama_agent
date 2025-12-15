/**
 * Neovim-style typing indicator with blinking cursor.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 text-[var(--fg-muted)]">
      <span className="text-[var(--yellow)]">~</span>
      <span>thinking</span>
      <span className="cursor-blink">▋</span>
    </div>
  );
}


// Arcade-styled error panel with a retry button. Used wherever a data fetch
// can fail so the UI never sits in an infinite loading state.

export function ErrorState({
  title = "SIGNAL LOST",
  message,
  onRetry,
  compact,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`border-2 border-ink rounded-card bg-cream shadow-arcade flex flex-col items-center gap-3 text-center ${
        compact ? "p-4" : "p-8"
      }`}
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <span
        className="font-bold text-destructive"
        style={{ fontSize: compact ? 12 : 14, letterSpacing: 2 }}
      >
        ! {title}
      </span>
      <p className="text-muted" style={{ fontSize: 10, lineHeight: 1.8 }}>
        {message ?? "COULD NOT REACH THE SHOP. CHECK YOUR CONNECTION."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-ink text-cream px-5 py-2.5 rounded-btn border-2 border-ink shadow-arcade-sm arcade-btn-active hover:bg-charcoal transition-all"
          style={{ fontSize: 10, letterSpacing: 2 }}
        >
          RETRY
        </button>
      )}
    </div>
  );
}

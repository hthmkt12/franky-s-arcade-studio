const TEXT =
  "WIN  STORE  COUPONS   ★   FREE  SHIPPING  OVER  €100   ★   HANDMADE  IN  PORTUGAL   ★   ";

export function TopMarquee() {
  return (
    <div className="marquee-sheen border-b border-ink overflow-hidden h-7 flex items-center">
      <div
        className="flex whitespace-nowrap text-ink"
        style={{
          fontFamily: "var(--font-arcade)",
          fontSize: 10,
          lineHeight: 1,
          animation: "marquee 40s linear infinite",
        }}
      >
        <span className="px-6">{TEXT.repeat(8)}</span>
        <span className="px-6">{TEXT.repeat(8)}</span>
      </div>
    </div>
  );
}

export function BottomMarquee() {
  return (
    <div className="border-t border-ink overflow-hidden h-6 flex items-center bg-cream">
      <div
        className="flex whitespace-nowrap text-muted"
        style={{
          fontFamily: "var(--font-arcade)",
          fontSize: 9,
          lineHeight: 1,
          animation: "marquee 60s linear infinite",
        }}
      >
        <span className="px-6">{TEXT.repeat(8)}</span>
        <span className="px-6">{TEXT.repeat(8)}</span>
      </div>
    </div>
  );
}

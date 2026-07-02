export function PixelHorse({ size = 8, color = "var(--ink)" }: { size?: number; color?: string }) {
  const grid = [
    "................",
    "......##.##.....",
    ".....####.##....",
    "....######.##...",
    "...########.#...",
    "...##.######....",
    "...#############",
    "...#############",
    "...##....##..##.",
    "...##....##..##.",
    "................",
    "................",
  ];
  return (
    <div
      className="grid"
      role="img"
      aria-label="Franky's pixel horse mascot"
      style={{
        gridTemplateColumns: `repeat(16, ${size}px)`,
        gridTemplateRows: `repeat(12, ${size}px)`,
      }}
    >
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: size,
              height: size,
              background: c === "#" ? color : "transparent",
            }}
          />
        )),
      )}
    </div>
  );
}

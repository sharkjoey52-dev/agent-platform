export type AvatarStyle = "square" | "circle" | "bot";
export type AvatarColor = "blue" | "orange" | "sky" | "green";

export const AVATAR_STYLES: { id: AvatarStyle; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "circle", label: "Circle" },
  { id: "bot", label: "Bot" },
];

export const AVATAR_COLORS: { id: AvatarColor; label: string; hex: string }[] = [
  { id: "blue", label: "Blue", hex: "#2f5fd0" },
  { id: "orange", label: "Orange", hex: "#f26a2e" },
  { id: "sky", label: "Light blue", hex: "#3b9be0" },
  { id: "green", label: "Green", hex: "#3fa83a" },
];

export function normStyle(value: string | null | undefined): AvatarStyle {
  return value === "square" || value === "circle" || value === "bot"
    ? value
    : "bot";
}

export function normColor(value: string | null | undefined): AvatarColor {
  return value === "blue" ||
    value === "orange" ||
    value === "sky" ||
    value === "green"
    ? value
    : "orange";
}

const INK = "#1c1b1a";

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x - 3} ${y}H${x + 3}M${x} ${y - 3}V${y + 3}M${x - 2} ${y - 2}L${
        x + 2
      } ${y + 2}M${x - 2} ${y + 2}L${x + 2} ${y - 2}`}
      stroke="#4f86ff"
      strokeWidth="1.3"
      strokeLinecap="round"
      fill="none"
    />
  );
}

export default function AgentAvatar({
  style,
  color,
  size = 32,
  thinking = false,
  className = "",
}: {
  style: AvatarStyle;
  color: AvatarColor;
  size?: number;
  thinking?: boolean;
  className?: string;
}) {
  const hex = AVATAR_COLORS.find((c) => c.id === color)?.hex ?? "#f26a2e";

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {style === "square" && (
        <rect x="5" y="5" width="38" height="38" rx="9" fill={hex} />
      )}
      {style === "circle" && <circle cx="24" cy="24" r="20" fill={hex} />}

      {(style === "square" || style === "circle") &&
        (thinking ? (
          <>
            <circle cx="17" cy="23" r="4.5" fill={INK} />
            <circle cx="31" cy="23" r="4.5" fill={INK} />
          </>
        ) : (
          <>
            <circle cx="17" cy="20" r="2.2" fill={INK} />
            <circle cx="31" cy="20" r="2.2" fill={INK} />
            <path
              d="M16 30 Q24 37 32 30"
              stroke={INK}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ))}

      {style === "bot" && !thinking && (
        <>
          <rect x="15" y="3" width="18" height="15" rx="2" fill="#f5f2ea" stroke={hex} strokeWidth="2.5" />
          <circle cx="21" cy="9.5" r="1.4" fill={INK} />
          <circle cx="27" cy="9.5" r="1.4" fill={INK} />
          <path d="M20.5 13 Q24 16 27.5 13" stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <rect x="8" y="18" width="32" height="18" rx="2" fill={hex} />
          <rect x="15" y="36" width="5" height="9" fill={hex} />
          <rect x="28" y="36" width="5" height="9" fill={hex} />
        </>
      )}

      {style === "bot" && thinking && (
        <>
          <rect x="6" y="12" width="36" height="22" rx="3" fill={hex} />
          <rect x="1" y="17" width="5" height="9" fill={hex} />
          <rect x="42" y="17" width="5" height="9" fill={hex} />
          <rect x="12" y="18" width="8" height="8" fill={INK} />
          <rect x="28" y="18" width="8" height="8" fill={INK} />
          <rect x="10" y="34" width="4" height="9" fill={hex} />
          <rect x="18" y="34" width="4" height="9" fill={hex} />
          <rect x="26" y="34" width="4" height="9" fill={hex} />
          <rect x="34" y="34" width="4" height="9" fill={hex} />
        </>
      )}

      {thinking && (
        <>
          <ellipse cx="38" cy="8" rx="9.5" ry="7" fill="#2f2e2c" stroke="#9b9a95" strokeWidth="1.2" />
          <g className="animate-pulse">
            <Sparkle x={34} y={8} />
            <Sparkle x={42} y={7} />
          </g>
        </>
      )}
    </svg>
  );
}

import { Star } from "lucide-react";

interface Props { rating: number; max?: number; size?: number; }

export default function StarRating({ rating, max = 5, size = 13 }: Props) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={size}
          style={{
            fill: i < Math.round(rating) ? "#f59e0b" : "transparent",
            color: i < Math.round(rating) ? "#f59e0b" : "var(--text-3)",
          }}
        />
      ))}
    </div>
  );
}

import { BadgeCheck, Crown } from "lucide-react";

export default function VerifiedBadge({
  size = 14,
  variant = "verified",
}: {
  size?: number;
  variant?: "verified" | "owner";
}) {
  if (variant === "owner") {
    return (
      <Crown
        size={size}
        className="inline-block shrink-0 align-middle text-[#F5B301]"
        fill="#F5B301"
        stroke="#8a6200"
        strokeWidth={1.5}
        aria-label="Dono do pulso"
      />
    );
  }

  return (
    <BadgeCheck
      size={size}
      className="inline-block shrink-0 align-middle text-[#3B82F6]"
      fill="#3B82F6"
      stroke="white"
      aria-label="Verificado"
    />
  );
}
